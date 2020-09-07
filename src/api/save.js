
// Works
// const CONTENT_API_URL = `http://localhost:3000`;
const CONTENT_API_URL = `https://twinejs-api.herokuapp.com`;

// TODO: Update docs, and code to mimic flow in ../file/save.js
function postData(url = '', data = {}) {
  console.log('Save data:', data);

  // Default options are marked with *
  return fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'omit', // include, *same-origin, omit
      headers: {
          'Origin': 'http://localhost:8080', // Client URL
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      redirect: 'follow', // manual, *follow, error
      // referrer: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(data), // body data type must match "Content-Type" header
  })
  .then(response => {
    if (response.status == 200) {
      // console.log(response);
      if (response.json) {
        return response.json(); // parses JSON response into native Javascript objects
      } else {
        console.error('What is going on here?');
      }  
    } else {
      console.log('HTTP status:', response.status);
      return Promise.reject(response);
    }
  })
  .catch(err => {
    return Promise.reject(err);
  });
}

function getData(url = '', useJson = true) {

  // Accounting for /api/health which returns text/html
  const contentType = useJson ? 'application/json' : 'text/html' ;

  // Default options are marked with *
  return fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      // mode: 'cors', // no-cors, cors, *same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      // credentials: 'same-origin', // include, *same-origin, omit
      headers: {
          'Content-Type': contentType,
      },
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // no-referrer, *client
      // body: JSON.stringify(data), // body data type must match "Content-Type" header
  })
  .then(response => {
    if (response.status == 200) {
      if (useJson) {
        return response.json() // parses JSON response into native Javascript objects
      } else {
        return response.text();
      }  
    } else {
      throw 'Unhandled HTTP status:', response.status;
    }
  })
  .catch(err => {
    throw err;
  });
}

/**
 * This should ideally be a class so I can track most recent succcess
 * and manage exponential backoff if needed
 */
const API = {
  available: false,

  check: () => {
    const duration = 5000;
    return apiHealth()
      .then(data => {
        return Promise.resolve(data); // API is initialized
      })
      .catch(err => {
        return Promise.reject(err); // API is not initialized or available
      });
  }
}

const apiHealth = () => {

	const url = `${CONTENT_API_URL}/api/health`;
	return getData(url, false)
		.then(data => {
      if (data === 'OK') {
        return Promise.resolve(true);
      } else {
        return Promise.reject(false);
      }
    })
		.catch(err => {
      throw err;
    });
}

const loadByAPI = (archive, filename, success, failure) => {
	// Example GET method implementation:
	const url = `${CONTENT_API_URL}/archive/raw`;
	return getData(url)
		.then(data => {
      if (data.status === 'ACK') {
        console.log('Loaded data..');
        return Promise.resolve(data.data);
      } else {
        return Promise.reject(data);
      }
    })
		.catch(err => console.error(err));
}

const saveByAPI = (archive, filename, success, failure) => {
	const data = {
		user: 'Scott',
		archive
	};

	// Example POST method implementation:
  const url = `${CONTENT_API_URL}/archive`;
  
  try {
    postData(url, data)
      .then(data => {
        // console.log('All data?', data);
        const msg = ['All good.'];

        if (data.status === 'ACK') {
          if (data.changes.local) {
            msg.push('Local changes were saved.');
          } else {
            msg.push('No local changes to save.');
          }
    
          if (data.changes.remote) {
            msg.push('Found uptream changes!')
            alert('Upstream changes found, please Import From File > Load From API')
          }

          console.log(msg.join(' '));
        } else {
          console.log('Error saving changes..');
          alert('Error saving changes, please save your file to disk!');

          // Force file to be saved locally?
        }

      }) // JSON-string from `response.json()` call
      .catch(err => console.error('Error:', err));
    
  } catch (err) {
    console.log(err);
  }

};

module.exports = {
  loadByAPI,
  saveByAPI,
  API
}

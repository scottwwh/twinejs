// The side toolbar of a story list.

const Vue = require('vue');
const AboutDialog = require('../../dialogs/about');
const FormatsDialog = require('../../dialogs/formats');
const ImportDialog = require('../../dialogs/story-import');
const {createStory} = require('../../data/actions/story');
const isElectron = require('../../electron/is-electron');
const locale = require('../../locale');
const {prompt} = require('../../dialogs/prompt');
const {publishArchive} = require('../../data/publish');
const saveFile = require('../../file/save');
const {API, saveByAPI} = require('../../api/save');


module.exports = Vue.extend({
	template: require('./index.html'),

	methods: {
		createStoryPrompt(e) {
			// Prompt for the new story name.

			prompt({
				message: locale.say(
					'What should your story be named?<br>(You can change this later.)'
				),
				buttonLabel: '<i class="fa fa-plus"></i> ' + locale.say('Add'),
				buttonClass: 'create',
				validator: name => {
					if (
						this.existingStories.find(story => story.name === name)
					) {
						return locale.say(
							'A story with this name already exists.'
						);
					}
				},

				origin: e.target
			}).then(name => {
				this.createStory({name});

				/* Allow the appearance animation to complete. */

				window.setTimeout(() => {
					this.$dispatch(
						'story-edit',
						this.existingStories.find(story => story.name === name)
							.id
					);
				}, 300);
			});
		},

		enableButtonsForAPI() {
			document.body.classList.add('api-available');
			const els = [...document.querySelectorAll('button.block.api')];
			els.forEach(el => {
				el.classList.remove('disable');
			})
		},

		importFile(e) {
			console.log(e);
			new ImportDialog({
				store: this.$store,
				data: {origin: e.target}
			}).$mountTo(document.body);
		},

		saveArchive(useAPI) {
			const timestamp = new Date()
				.toLocaleString()
				.replace(/[\/:\\]/g, '.');

			const archive = publishArchive(this.existingStories, this.appInfo);

			if (useAPI) {
				saveByAPI(archive);

			} else {
				const filename = `${timestamp} ${locale.say('Twine Archive.html')}`;
				saveFile(archive, filename);
			}
		},

		saveToFile() {
			this.saveArchive();
		},

		saveToAPI() {
			this.saveArchive(true);
		},

		showAbout(e) {
			new AboutDialog({
				store: this.$store,
				data: {origin: e.target}
			}).$mountTo(document.body);
		},

		showFormats(e) {
			new FormatsDialog({
				store: this.$store,
				data: {origin: e.target}
			}).$mountTo(document.body);
		},

		showHelp() {
			window.open('https://twinery.org/2guide');
		},

		showLocale() {
			window.location.hash = 'locale';
		}
	},

	created() {
		const available = API.check();
		available.then(data => {
			this.enableButtonsForAPI();

			if (this.existingStories.length === 0) {
				console.log('We have no stories - open the dialog!');

				// Method requires an event target?
				const el = this.$el.querySelector('button.block.api');
				const e = { target: el };
				this.importFile(e);
			} else {
				// Check API for updates or available number of stories?
				console.log(`We already have ${this.existingStories.length} stories loaded - don't open dialog`);
			}
		})
		.catch(err => {
			const duration = 5000;
			const errorMsg = `API not available, retry in ${duration/1000}s`;
			console.log(errorMsg);

			let interval = setInterval(() => {
				const available = API.check();
				available.then(data => {
					console.log('API now available');
					this.enableButtonsForAPI();
					clearInterval(interval);
					// console.log('hello!', this);
					// this.importFile();

					// TODO: Start new interval checking every 60 seconds
				})
				.catch(err => {
					console.log(errorMsg);
				});
			}, duration);
		});

		// Should be added within mounted (??) but not available within Vue v1
		// Ref: https://stackoverflow.com/a/50343133/351695
		//
		// console.log('we are created!');
		// this.$root.$on('import', () => {
		// 	console.log('hi hi hi');

        //     // your code goes here
        //     this.importFile();
        // });
	},

	components: {
		'quota-gauge': require('../../ui/quota-gauge'),
		'theme-switcher': require('./theme-switcher')
	},

	vuex: {
		actions: {
			createStory
		},

		getters: {
			appInfo: state => state.appInfo,
			existingStories: state => state.story.stories
		}
	}
});

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

		importFile(e) {
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

		saveToAPIButton() {
			this.$el.querySelector('button.block.api').classList.add('available');
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
		console.log('created:', this);

		const available = API.check();
		available.then(data => {
			this.saveToAPIButton();
		})
		.catch(err => {
			let duration = 5000;
			let interval = setInterval(() => {
				const available = API.check();
				available.then(data => {
					console.log('API now available');
					this.saveToAPIButton();
					clearInterval(interval);
				})
				.catch(err => {
					console.log(`API not available, retry in ${duration/1000}s`);
				});
			}, duration);
		});
	},

	// Not firing?
	mounted() {
		console.log('mounted:', this);
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

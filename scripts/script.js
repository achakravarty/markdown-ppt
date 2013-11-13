var MarkdownPpt = Ember.Application.create();

MarkdownPpt.Router.map(function(){
	this.resource("slides", function(){
		this.resource("slide", {path:":slide_id"});
	});
});

var animations = {
	left: {
		outClass: 'slide-to-right',
		inClass: 'slide-from-left'
	},
	right: {
		outClass: 'slide-to-left',
		inClass: 'slide-from-right'
	},
	top: {
		outClass: 'slide-to-bottom',
		inClass: 'slide-from-top'
	},
	bottom: {
		outClass: 'slide-to-top',
		inClass: 'slide-from-bottom'
	}
}

MarkdownPpt.Slide = Ember.Object.extend({
	id:'',
	header:'',
	content:'',
	animation:'',
	classes:'',	
	number:function(){
		return this.id + 1;
	}.property('id')
});

var slides = [
MarkdownPpt.Slide.create({
	id:0,
	header:'New Slide',
	content:'',
	animation:'',
	classes:'slide-1'
})
];

MarkdownPpt.SlidesRoute = Ember.Route.extend({
	model:function(){
		return slides;
	}
});

MarkdownPpt.SlideRoute = Ember.Route.extend({
	model:function(params){
		return slides[params.slide_id];
	}
});

MarkdownPpt.SlidesController = Ember.ObjectController.extend(Ember.Evented, {
	needs: ['slide'],
	isFullScreenMode:false,
	isFullScreenEnabled: function(){
		return !(this.get('isFullScreenMode') || this.get('controllers.slide.isEditing'));
	}.property('isFullScreenMode', 'controllers.slide.isEditing'),
	actions:{
		addSlide:function(){
			var currentSlideCount = this.get('model.length');
			this.get('model').pushObject(MarkdownPpt.Slide.create(
			{
				id: currentSlideCount, 
				header: 'New Slide'
			}));
		},
		goFullScreen:function(){
			this.set('isFullScreenMode', true);
		},
		exitFullScreen: function(){
			this.set('isFullScreenMode', false);
		},
		animate: function(slide, anim){
			var animation = animations[anim];
			this.get('model').objectAt(slide.id).set('animation', animation);
			if(slide.id > 0){
				if(this.get('model').objectAt(slide.id - 1).get('animation') == ''){
					this.get('model').objectAt(slide.id - 1).set('animation', animation);
				}
			}
		}
	}
});

MarkdownPpt.SlideController = Ember.ObjectController.extend(Ember.Evented, {
	needs:['slides'],
	isEditing: false,
	modelChanged:function(){
		if(this.get('isFullScreenMode')){
			this.trigger('transition');
		}
	}.observes('model'),
	slideClasses: function(){
		return {
			current:'slide slide-current jCurrent ' + this.get('model').get('classes'),
			previous: 'slide jPrev ' + this.get('model').get('classes')		
		}
	}.property('model'),
	isFullScreenMode:function(){
		return this.get('controllers.slides.isFullScreenMode');		
	}.property('controllers.slides.isFullScreenMode'),	
	actions:{
		edit:function(){
			this.set('isEditing', true);
		},
		done:function(){
			this.set('isEditing', false);
		},
		goToPreviousSlide: function(){
			if(this.get('model').get('id') > 0){
				this.transitionToRoute("/slides/" + (this.get('model').get('id') - 1));
			}
		},
		goToNextSlide: function(){
			var slides = this.get('controllers.slides.model.length');
			if(this.get('model').get('id') < slides - 1){
				this.transitionToRoute("/slides/" + (this.get('model').get('id') + 1));
			}
		}
	}
});

MarkdownPpt.SlidesView = Ember.View.extend({
	didInsertElement:function(){
		var $root = this.$();	
		var self = this;	
		$(document).keyup(function(e) {
			if (e.keyCode == 27) {
				self.get('controller').send('exitFullScreen');
			}
		});
	}
});

MarkdownPpt.SlideView = Ember.View.extend({
	didInsertElement: function(){
		var self= this;
		this.get('controller').on('transition', $.proxy(function () {
			this.doTransition();
		}, this));
		$(document).on('keyup', function(e) {
			if(self.get('controller.isFullScreenMode')){
				if (e.keyCode == 37) {				
					self.get('controller').send('goToPreviousSlide');
				}
				else if (e.keyCode == 39) {
					self.get('controller').send('goToNextSlide');	
				}
			}
		});
	},
	insertPreviousSlide: function(){
		if(this.get('controller.isFullScreenMode')){
			if($(".jPrev", $root).length == 0){
				var $root = this.$();
				var slideClasses = this.get('controller.slideClasses');
				var slideContents = $('.jCurrent', $root).clone();
				slideContents.find(".panel-heading").remove();
				var prevSlide = $('<div></div>')
				.append(slideContents.html())
				.addClass(slideClasses.previous);
				$('#ppt-main', $root).append(prevSlide);	
			}					
		}
		else{
			if($(".jPrev", $root).length > 0){
				$(".jPrev", $root).remove();				
			}			
		}
	}.observes('controller.isFullScreenMode'),
	doTransition:function(){
		var $root = this.$();

		previousSlideTransitionComplete = false,
		currentSlideTransitionComplete = false;

		var animEndEventName = "webkitAnimationEnd";

		var previousSlide = $(".jPrev", $root);
		var currentSlide = $(".jCurrent", $root);

		previousSlide.addClass('slide-current');

		var animation = this.get('controller.model.animation');
		var outAnimation = animation.outClass;
		var inAnimation = animation.inClass;

		previousSlide.addClass(outAnimation).on(animEndEventName, function() {
			previousSlide.off(animEndEventName);
			previousSlideTransitionComplete = true;
			if(currentSlideTransitionComplete) {
				onTransitionCompleted(previousSlide, currentSlide);
			}
		});

		currentSlide.addClass(inAnimation).on(animEndEventName, function() {
			currentSlide.off(animEndEventName);
			currentSlideTransitionComplete = true;
			if(previousSlideTransitionComplete) {
				onTransitionCompleted(previousSlide, currentSlide);
			}
		});

		var self = this;

		var onTransitionCompleted = function(prevSlide, currSlide) {
			previousSlideTransitionComplete = false;
			currentSlideTransitionComplete = false;
			resetSlides(prevSlide, currSlide);			
		};

		var resetSlides = function(prevSlide, currSlide) {
			var prevSlideContent = $(".jCurrent", $root).html();
			prevSlide.html(prevSlideContent);
			var slideClasses = self.get('controller.slideClasses');
			prevSlide.removeClass().addClass(slideClasses.previous);
			currSlide.removeClass().addClass(slideClasses.current);
		};
	}
});

var showdown = new Showdown.converter();

Ember.Handlebars.helper('markdown', function(input) {
	return new Handlebars.SafeString(showdown.makeHtml(input));
});
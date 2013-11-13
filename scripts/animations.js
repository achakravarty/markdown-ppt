var Animations = function(){
	var _animations = {
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
	};
	var get = function(name){
		return _animations[name];
	};

	var animate : function($root){
		var previousSlideTransitionComplete = false,
		var currentSlideTransitionComplete = false;

		var animEndEventName = "webkitAnimationEnd";

		var previousSlide = $(".jPrev", $root);
		var currentSlide = $(".jCurrent", $root);

		previousSlide.addClass('slide-current');

		var outAnimation = this.get('controller').get('previousSlideAnimation').outClass;
		var inAnimation = this.get('controller').get('currentSlideAnimation').inClass;

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
}();
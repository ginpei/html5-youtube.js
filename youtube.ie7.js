window.youtube.bind = function(fn, context) {
	var args = Array.prototype.slice.call(arguments, 2);
	return function() {
		var curArgs = args.concat(arguments);
		return fn.apply(context, curArgs);
	};
};

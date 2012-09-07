// Use <? ?> for template tags.
var $ = jQuery.noConflict();
_.templateSettings = {
	evaluate:  /<\?(.+?)\?>/g,
	interpolate: /<\?=(.+?)\?>/g
};
// Set up openhmis "namespace"
if (window.openhmis === undefined) window.openhmis = {};
if (window.openhmis.template === undefined) window.openhmis.templates = {};

// Use uuid for id
Backbone.Model.prototype.idAttribute = 'uuid';

// OpenMRS-specific delete functions
//
// Add retire function for models
Backbone.Model.prototype.retire = function(options) {
	options = options ? _.clone(options) : {};
	if (options.reason !== undefined)
		options.url = this.url() + "?reason=" + encodeURIComponent(options.reason);

	if (this.isNew()) {
		return false;
	}

	var model = this;
	var success = options.success;
	options.success = function(resp) {
		model.set('retired', true);
		model.trigger('retired', model);
		if (success) {
			success(model, resp);
		} else {
			model.trigger('sync', model, resp, options);
		}
	};

	options.error = Backbone.wrapError(options.error, model, options);
	var xhr = (this.sync || Backbone.sync).call(this, 'delete', this, options);
	return xhr;
}

// Add purge function for models
Backbone.Model.prototype.purge = function(options) {
	options = options ? options : {};
	options.url = this.url() + "?purge=true";
	Backbone.Model.prototype.destroy.call(this, options);
}

Backbone.Model.prototype.isRetired = function() {
	return this.get('retired') || this.get('voided');
}

Backbone.Model.prototype.getDataType = function () {
	if (this.get('retired') !== undefined)
		return 'metadata';
	if (this.get('voided') !== undefined)
		return 'data';
	return 'unknown';
}

/**
 * Template helper function
 *
 * Fetches a template from a remote URI unless it has been previously fetched
 * and cached.
 */
Backbone.View.prototype.tmplFileRoot = '/openmrs/moduleResources/openhmis/cashier/template/';
Backbone.View.prototype.getTemplate = function(context) {
	var view = this;
	if (window.openhmis.templates[view.tmplFile] === undefined) {
		var uri = view.tmplFileRoot === undefined ? view.tmplFile : view.tmplFileRoot + view.tmplFile;
		$.ajax({
			url: uri,
			async: false,
			dataType: "html",
			success: function(data, status, jq) {
				openhmis.templates[view.tmplFile] = $("<div/>").html(data);
			}
		});
	}
	return _.template($(openhmis.templates[view.tmplFile]).find(view.tmplSelector).html());
}

// Capitalize first letter
capitalize = function(string) {
	return string.charAt(0).toUpperCase() + string.substring(1);
}
/* Copyright 2012 Guewen Baconnier (Camptocamp SA)
   Copyright 2016 Antonio Espinosa <antonio.espinosa@tecnativa.com>
   Copyright 2021 Dhara Solanki <dhara.solanki@initos.com>
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

odoo.define("web_translate_dialog.translate_dialog", function (require) {
    "use strict";

    var core = require("web.core");
    var BasicController = require("web.BasicController");
    var Dialog = require("web.Dialog");
    var FormController = require("web.FormController");
    var _t = core._t;
    var TranslationDialog = require("web.TranslationDialog");

    TranslationDialog.include({
        init: function (parent, options) {
            var field_names = null;
            var title_string = _t("Translate fields: /");
            if (options.fieldName) {
                field_names = options.fieldName;
                title_string = title_string.replace("/", field_names);
            } else {
                field_names = this.get_translatable_fields(parent);
                options.domain.push(["res_id", "=", options.res_id]);
            }
            for (var i in field_names) {
                var field_key = _.str.sprintf("search%s", field_names[i]);
                if (options[field_key]) {
                    options.domain.push("|");
                    options.domain.push(["name", "=", options[field_key]]);
                }
            }
            this.translatable_fields = field_names;
            this.view = parent;
            this._super(
                parent,
                _.extend(
                    {
                        size: "x-large",
                        title: title_string,
                        dataPointID: parent.initialState.id,
                        fieldName: field_names,
                    },
                    options
                )
            );
        },
        get_translatable_fields: function (parent) {
            var field_list = [];
            _.each(parent.renderer.state.fields, function (field, name) {
                var related_readonly =
                    typeof field.related !== "undefined" && field.readonly;
                if (
                    field.translate === true &&
                    !related_readonly &&
                    parent.renderer.state.getFieldNames().includes(name)
                ) {
                    field_list.push(name);
                }
            });
            return field_list;
        },
        resize_textareas: function () {
            var textareas = this.$("textarea.oe_translation_field");
            var max_height = 100;
            // Resize textarea either to the max height of its content if it stays
            // in the modal or to the max height available in the modal
            if (textareas.length) {
                _.each(textareas, function (textarea) {
                    if (textarea.scrollHeight > max_height) {
                        max_height = textarea.scrollHeight;
                    }
                });
                var max_client_height =
                    $(window).height() - $(".modal-content").height();
                var new_height = Math.min(max_height, max_client_height);
                textareas.css({minHeight: new_height});
            }
        },
        set_maxlength: function () {
            // Set maxlength if initial field has size attr
            _.each(
                this.translatable_fields,
                function (field_name) {
                    var size = $("[name=" + field_name + "]")[0].maxLength;
                    if (size > 0) {
                        this.$(
                            'input.oe_translation_field[name$="' +
                                field_name +
                                '"], textarea.oe_translation_field[name$="' +
                                field_name +
                                '"]'
                        ).attr("maxlength", size);
                    }
                },
                this
            );
        },
        initialize_html_fields: function (lang) {
            // Initialize summernote if HTML field
            this.$(
                '.oe_form_field_html .oe_translation_field[name^="' + lang + '-"]'
            ).each(function () {
                var $parent = $(this)
                    .summernote({
                        focus: false,
                        toolbar: [
                            ["style", ["style"]],
                            ["font", ["bold", "italic", "underline", "clear"]],
                            ["fontsize", ["fontsize"]],
                            ["color", ["color"]],
                            ["para", ["ul", "ol", "paragraph"]],
                            ["table", ["table"]],
                            ["insert", ["link", "picture"]],
                            ["misc", ["codeview"]],
                            ["history", ["undo", "redo"]],
                        ],
                        prettifyHtml: false,
                        styleWithSpan: false,
                        inlinemedia: ["p"],
                        lang: "odoo",
                        onChange: function (value) {
                            $(this).toggleClass(
                                "touched",
                                value !== $(this).attr("data-value")
                            );
                        },
                    })
                    .parent();
                // Triggers a mouseup to refresh the editor toolbar
                $parent.find(".note-editable").trigger("mouseup");
                $parent.find(".note-editing-area").css({
                    minHeight: "100px",
                    minWidth: "260px",
                });
            });
        },

        willStart: function () {
            return Promise.all([
                this._super(),
                this._loadLanguages().then((l) => {
                    this.languages = l;
                    return this._loadTranslations().then((t) => {
                        this.translations = t;
                    });
                }),
            ]).then(() => {
                this.data = this.translations.map((term) => {
                    const relatedLanguage = this.languages.find(
                        (language) => language[0] === term.lang
                    );
                    if (!term.value && !this.showSrc) {
                        term.value = term.src;
                    }
                    return {
                        id: term.id,
                        name: term.name.split(",")[1],
                        lang: term.lang,
                        langName: relatedLanguage[1],
                        source: term.src,
                        // We set the translation value coming from the database, except for the language
                        // the user is currently utilizing. Then we set the translation value coming
                        // from the value of the field in the form
                        value:
                            term.lang === this.currentInterfaceLanguage &&
                            !this.showSrc &&
                            !this.isComingFromTranslationAlert
                                ? this.userLanguageValue
                                : term.value || "",
                    };
                });
                this.data.sort((left, right) =>
                    left.langName < right.langName ||
                    (left.langName === right.langName && left.source < right.source)
                        ? -1
                        : 1
                );
            });
        },

        _loadTranslations: function () {
            const domain = [
                ...this.domain,
                ["lang", "in", this.languages.map((l) => l[0])],
            ];
            return this._rpc({
                model: "ir.translation",
                method: "search_read",
                fields: ["lang", "src", "value", "name"],
                domain: domain,
            });
        },

        _onSave: function () {
            // Overwrite this method to loop the fieldnames when
            // modified the translation value of current ineterface.
            var updatedTerm = {};
            var updateFormViewField;

            this.el.querySelectorAll("input[type=text],textarea").forEach((t) => {
                var initialValue = this.data.find((d) => d.id == t.dataset.id);
                if (initialValue.value !== t.value) {
                    updatedTerm[t.dataset.id] = t.value;

                    if (
                        initialValue.lang === this.currentInterfaceLanguage &&
                        !this.showSrc
                    ) {
                        // When the user has changed the term for the language he is
                        // using in the interface, this change should be reflected
                        // in the form view
                        // partial translations being handled server side are
                        // also ignored
                        var changes = {};
                        for (var i in this.fieldName) {
                            if (initialValue.name === this.fieldName[i]) {
                                changes[this.fieldName[i]] =
                                    updatedTerm[initialValue.id];
                            }
                        }
                        updateFormViewField = {
                            dataPointID: this.dataPointID,
                            changes: changes,
                            doNotSetDirty: false,
                        };
                    }
                }
            });

            // UpdatedTerm only contains the id and values of the terms that
            // have been updated by the user
            var saveUpdatedTermsProms = Object.keys(updatedTerm).map((id) => {
                var writeTranslation = {
                    model: "ir.translation",
                    method: "write",
                    context: this.context,
                    args: [[parseInt(id, 10)], {value: updatedTerm[id]}],
                };
                return this._rpc(writeTranslation);
            });
            return Promise.all(saveUpdatedTermsProms).then(() => {
                // We might have to update the value of the field on the form
                // view that opened the translation dialog
                if (updateFormViewField) {
                    this.trigger_up("field_changed", updateFormViewField);
                }
            });
        },
    });

    FormController.include({
        get_translatable_fields: function (parent) {
            var field_list = [];
            _.each(parent.renderer.state.fields, function (field, name) {
                var related_readonly =
                    typeof field.related !== "undefined" && field.readonly;
                if (
                    field.translate === true &&
                    !related_readonly &&
                    parent.renderer.state.getFieldNames().includes(name)
                ) {
                    field_list.push(name);
                }
            });
            return field_list;
        },

        _getActionMenuItems: function (state) {
            if (!this.hasActionMenus || this.mode === "edit") {
                return null;
            }
            const props = this._super(...arguments);
            const activeField = this.model.getActiveField(state);
            const otherActionItems = [];
            if (this.archiveEnabled && activeField in state.data) {
                if (state.data[activeField]) {
                    otherActionItems.push({
                        description: _t("Archive"),
                        callback: () => {
                            Dialog.confirm(
                                this,
                                _t(
                                    "Are you sure that you want to archive this record?"
                                ),
                                {
                                    confirm_callback: () =>
                                        this._toggleArchiveState(true),
                                }
                            );
                        },
                    });
                } else {
                    otherActionItems.push({
                        description: _t("Unarchive"),
                        callback: () => this._toggleArchiveState(false),
                    });
                }
            }
            if (this.activeActions.create && this.activeActions.duplicate) {
                otherActionItems.push({
                    description: _t("Duplicate"),
                    callback: () => this._onDuplicateRecord(this),
                });
            }
            if (this.activeActions.delete) {
                otherActionItems.push({
                    description: _t("Delete"),
                    callback: () => this._onDeleteRecord(this),
                });
            }
            if (this.mode !== "edit") {
                otherActionItems.push({
                    description: _t("Translate"),
                    callback: () => this._onButtonTranslate(state),
                });
            }
            return Object.assign(props, {
                items: Object.assign(this.toolbarActions, {other: otherActionItems}),
            });
        },

        _onButtonTranslate: async function (state) {
            var self = this;
            $.when(this.has_been_loaded).then(function () {
                self.open_translate_dialog(null, state.res_id);
            });
        },
    });

    BasicController.include({
        get_translatable_fields: function (parent) {
            var field_list = [];
            _.each(parent.renderer.state.fields, function (field, name) {
                var related_readonly =
                    typeof field.related !== "undefined" && field.readonly;
                if (
                    field.translate === true &&
                    !related_readonly &&
                    parent.renderer.state.getFieldNames().includes(name)
                ) {
                    field_list.push(name);
                }
            });
            return field_list;
        },
        open_translate_dialog: async function (field, res_id) {
            var record = this.model.get(this.initialState.id, {raw: true});
            var field_names = this.get_translatable_fields(this);
            var result = await this._rpc({
                route: "/web/dataset/call_button",
                params: {
                    model: "ir.translation",
                    method: "translate_fields",
                    args: [record.model, res_id, field_names],
                    kwargs: {context: record.getContext()},
                },
            });
            var context = result.context;
            var options = {};
            for (var i in field_names) {
                var field_key = _.str.sprintf("search%s", field_names[i]);
                var search_key = _.str.sprintf("search_default_%s", field_names[i]);
                options[field_key] = context[search_key];
            }
            options.dataPointID = record.id;
            options.domain = [];
            options.isText = result.context.translation_type === "text";
            options.showSrc = result.context.translation_show_src;
            options.isComingFromTranslationAlert = true;
            options.translatable_fields = field_names;
            options.res_id = res_id;
            this.TranslationDialog = new TranslationDialog(this, options);
            this.TranslationDialog.open();
        },
    });
});

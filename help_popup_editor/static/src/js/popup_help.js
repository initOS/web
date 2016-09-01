openerp.help_popup_editor = function(instance, local) {

    var _t = instance.web._t;
    instance.web.ViewManager.include({

        do_create_view: function(view_type) {
            var self = this;
            var res = self._super(view_type);
            self.$el.find('span.view_help_customization').each(function () {
                var $elem = $(this);
                if ($elem.data('click-init')) {
                    return true;
                }
                $elem.on('click', function(e) {
                    var xPath = "//select[@class='oe_debug_view']//option[@data-model='ir.actions.act_window']";
                    var option = document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    option = $(option);
                    var model = option.data('model');
                    var id = option.data('id');
                    var action = { name : option.text() }
                    action = _.extend({
                        context: {'form_view_ref': 'help_popup_editor.view_help_popup_editor_add_video'},
                        res_model : 'ir.actions.act_window',
                        res_id : self.action.id,
                        type : 'ir.actions.act_window',
                        view_type : 'form',
                        view_mode : 'form',
                        views : [[false, 'form']],
                        target : 'new'
                    }, action || {});
                    self.do_action(action);
                });
                var Users = new openerp.web.Model('res.users');
                Users.call('has_group', ['help_popup_editor.group_video_help_manager']).done(function(set_visible) {
                    if (set_visible) {
                        $elem.show();
                    }
                });
                return true;
            });

            self.$el.find('span.view_help').each(function () {
                var $elem = $(this);
                if ($elem.data('click-init')) {
                    $elem.off('click');
                    $elem.data('click-init', false);
                    $elem.data('click-init_editor', false);
                }
                if ($elem.data('click-init_editor')) {
                    return true;
                }
                $elem.data('click-init_editor', true);
                if (self.action.id == undefined || (self.action.advanced_help == '' && self.action.enduser_help == '')) {
                    self.$el.find('span.view_help').hide()
                }
                $elem.on('click', function(e) {
                    var params = 'height=650, width=800, location=no, ';
                    params += 'resizable=yes, menubar=yes';
                    path = self.action.id;
                    my_window = window.open('/report/html/help_popup_editor.tpl_help_editor/' + path, 'Help', params);
                    // allows to back to the window if opened previoulsy
                    setTimeout('my_window.focus()', 1);
                });

                return true;

            });
            return res;
        },
    });
}

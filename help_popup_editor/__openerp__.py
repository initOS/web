# -*- coding: utf-8 -*-
# © 2016 Mathias Francke (initOS GmbH)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Help Popup Editor',
    'version': '8.0.1.0.0',
    'author': 'initOS GmbH',
    'category': '',
    'description': """
Help Popup Editor
=================
Extension for Help Popup Module that adds a new Button next to the help button from the original module.
This new button is only visible for users of the group "Help Manager".
Clicking this Button opens a Popup Dialog with editing panels for the fields introduced by Help Popup module.

The "End User Help" field supports HTML but the Tags being allowed are set in "models/cleaner.py".
""",
    'website': 'http://www.initos.com',
    'license': 'AGPL-3',
    'images': [],
    'depends': [
        'web',
        'help_popup',
        'base',
    ],
    'data': [
        'data/res_groups.xml',
        'views/popup_help_view.xml',
        'report/report.xml',
        'report/help.xml',
    ],
    'demo': [
    ],
    'qweb': [
        'static/src/xml/popup_help.xml',
    ],
    'installable': True,
}

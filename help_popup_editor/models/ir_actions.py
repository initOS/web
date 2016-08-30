# -*- coding: utf-8 -*-
# © 2016 Mathias Francke (initOS GmbH)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, models


class ActWindow(models.Model):
    _inherit = 'ir.actions.act_window'

    @api.multi
    def save_button(self):
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }

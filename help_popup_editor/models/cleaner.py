# -*- coding: utf-8 -*-
# © 2016 Mathias Francke (initOS GmbH)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp.tools.mail import _Cleaner

orig_allow_element = _Cleaner.allow_element


def my_allow_element(self, el):
    if el.tag == 'iframe':
        return True
    return orig_allow_element(self, el)


_Cleaner.allow_element = my_allow_element

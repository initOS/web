# Copyright 2019 Camptocamp SA
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl)
from odoo import api, models


class IrTranslation(models.Model):
    _inherit = "ir.translation"

    @api.model
    def translate_fields(self, model, id, field=None):
        """ Open a view for translating the field(s) of the record (model, id). """
        main_lang = "en_US"
        record = self.env[model].with_context(lang=main_lang).browse(id)
        context = {}
        if field and isinstance(field, list):
            for fieldname in field:
                res = super(IrTranslation, self).translate_fields(model, id, fieldname)
                fld = record._fields[fieldname]
                if not fld.related:
                    context.update(
                        {
                            "search_default_%s"
                            % (fld.name): "%s,%s"
                            % (fld.model_name, fld.name),
                        }
                    )
            res["context"].update(context)
        else:
            res = super(IrTranslation, self).translate_fields(model, id, field)
        return res

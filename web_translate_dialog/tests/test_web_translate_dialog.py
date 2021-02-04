# Copyright 2021 InitOS Gmbh
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl)
from odoo.tests.common import TransactionCase


class TestWebTranslateDialog(TransactionCase):
    def setUp(self):
        super(TestWebTranslateDialog, self).setUp()
        self.env["res.lang"]._activate_lang("de_DE")
        self.partner_title = self.env["res.partner.title"].create({"name": "Doctor"})

    def test_language_translations(self):
        translation = self.env["ir.translation"].create(
            {
                "type": "model",
                "name": "res.partner.title,name",
                "lang": "de_DE",
                "res_id": self.partner_title.id,
                "src": "Doctor",
                "value": "Arzt",
                "state": "translated",
            }
        )
        translation_value = translation.read(["value"])
        self.assertEqual(translation_value[0]["value"], "Arzt")

    def test_get_field_translations(self):
        self.env["ir.translation"].translate_fields(
            "res.partner.title", self.partner_title.id, ["name"]
        )
        translations = self.env["ir.translation"].search(
            [
                ("name", "=", "res.partner.title,name"),
                ("res_id", "=", self.partner_title.id),
            ],
            order="lang",
        )
        self.assertEqual(len(translations), 2)

        # Translate in both language
        translations[0].value = "Arzt"
        translations[1].value = "Doctor"

        # lang=None bypass translation system
        self.assertEqual(self.partner_title.with_context(lang=None).name, "Doctor")
        self.assertEqual(self.partner_title.with_context(lang="de_DE").name, "Arzt")
        self.assertEqual(self.partner_title.with_context(lang="en_US").name, "Doctor")

    def test_get_field_translations_01(self):
        self.env["ir.translation"].translate_fields(
            "res.partner.title", self.partner_title.id, "name"
        )
        translations = self.env["ir.translation"].search(
            [
                ("name", "=", "res.partner.title,name"),
                ("res_id", "=", self.partner_title.id),
            ],
            order="lang",
        )
        self.assertEqual(len(translations), 2)

        # Translate in both language
        translations[0].value = "Arzt"
        translations[1].value = "Doctor"

        # lang=None bypass translation system
        self.assertEqual(self.partner_title.with_context(lang=None).name, "Doctor")
        self.assertEqual(self.partner_title.with_context(lang="de_DE").name, "Arzt")
        self.assertEqual(self.partner_title.with_context(lang="en_US").name, "Doctor")

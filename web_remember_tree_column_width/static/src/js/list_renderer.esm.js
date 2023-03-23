/** @odoo-module */

import {ListRenderer} from "@web/views/list/list_renderer";
import {patch} from "@web/core/utils/patch";

patch(ListRenderer.prototype, "ColumnWidthResize", {
    _getLocalStorageWidthColumnName(model, field) {
        return "odoo.columnWidth." + model + "." + field;
    },
    onColumnTitleMouseUp(ev) {
        this._super.apply(this, arguments);
        if (this.resizeInProgress) {
            this.resizeInProgress = false;
            const target = $(ev.target);
            const $th = target.is("th") ? target : target.parent("th");
            const fieldName = $th.length ? $th.data("name") : undefined;
            if (
                this.state &&
                this.props.list.resModel &&
                fieldName &&
                window.localStorage
            ) {
                window.localStorage.setItem(
                    this._getLocalStorageWidthColumnName(
                        this.props.list.resModel,
                        fieldName
                    ),
                    parseInt(($th[0].style.width || "0").replace("px", "")) || 0
                );
            }
        }
    },
    onStartResize() {
        this.resizeInProgress = true;
        this._super.apply(this, arguments);
    },
    computeColumnWidthsFromContent() {
        const columnWidths = this._super.apply(this, arguments);

        const table = this.tableRef.el;
        const thElements = [...table.querySelectorAll("thead th")];
        const self = this;
        thElements.forEach(function (el, elIndex) {
            const fieldName = $(el).data("name");
            if (
                self.props.list &&
                self.props.list.resModel &&
                fieldName &&
                window.localStorage
            ) {
                const storedWidth = window.localStorage.getItem(
                    self._getLocalStorageWidthColumnName(
                        self.props.list.resModel,
                        fieldName
                    )
                );
                if (storedWidth) {
                    columnWidths[elIndex] = parseInt(storedWidth);
                }
            }
        });
        return columnWidths;
    },
});

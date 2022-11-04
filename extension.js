/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Gio, GLib, IBus } = imports.gi
const { getInputSourceManager } = imports.ui.status.keyboard

class Extension {
	constructor() {}

	/**
	 * @param {any} condition
	 * @param {number} interval
	 * @returns {Promise<null>}
	 */
	async waitUntil(condition, interval = 20) {
		return new Promise(resolve => {
			let id = setInterval(() => {
				if (id != this.timer || condition()) {
					resolve()
					clearInterval(id)
				};
			}, interval)
			this.timer = id
		})
	}

	/**
	 * @param {any} props
	 * @returns {string}
	 */
	getMode(props) {
		let mode = ''
		if (!props) {
			return mode
		}
		let p
		for (let i = 0; (p = props.get(i)) != null; ++i) {
			let key = p.get_key()
			if (!key.startsWith('InputMode')) {
				continue
			}
			let type = p.get_prop_type()
			switch (type) {
				case IBus.PropType.MENU:
					return this.getMode(p.get_sub_props())
				case IBus.PropType.RADIO:
					if (p.get_state() == 1) {
						[, mode] = key.split('.')
						return mode
					}
					break
				case IBus.PropType.NORMAL:
					return p.get_symbol ? p.get_symbol().get_text() : p.get_label().get_text()
				default:
					break
			}
		}
		return mode
	}

	/**
	 * @param {any} props
	 * @param {string} mode
	 */
	setMode(props, mode) {
		if (!props) {
			return
		}
		let p
		for (let i = 0; (p = props.get(i)) != null; ++i) {
			let key = p.get_key()
			if (!key.startsWith('InputMode')) {
				continue
			}
			let type = p.get_prop_type()
			switch (type) {
				case IBus.PropType.MENU:
					return this.setMode(p.get_sub_props(), mode)
				case IBus.PropType.RADIO:
					if (p.get_state() == 1) {
						let [, curMode] = key.split('.')
						if (curMode != mode) {
							this._ibusManager.activateProperty(`InputMode.${mode}`, IBus.PropState.CHECKED)
						}
						return
					}
					break
				case IBus.PropType.NORMAL:
					let curMode = p.get_symbol ? p.get_symbol().get_text() : p.get_label().get_text()
					if (curMode != mode) {
						this._ibusManager.activateProperty('InputMode', IBus.PropState.CHECKED)
					}
					return
				default:
					break
			}
		}
	}

	enable() {
		let ifaceXml = `
		<node>
			<interface name="org.gnome.Shell.Extensions.IbusSwitcher">
				<method name="SourceSize">
					<arg direction="out" name="size" type="u"/>
				</method>
				<method name="CurrentSource">
					<arg direction="out" name="index" type="s"/>
				</method>
				<method name="SwitchSource">
					<arg direction="in" name="index" type="u"/>
					<arg direction="in" name="mode" type="s"/>
					<arg direction="out" name="oldSource" type="s"/>
				</method>
			</interface>
		</node>
		`
		this._dbus = Gio.DBusExportedObject.wrapJSObject(ifaceXml, this)
		this._inputSourceManager = getInputSourceManager()
		this._ibusManager = this._inputSourceManager._ibusManager
		this._dbus.export(Gio.DBus.session, "/org/gnome/Shell/Extensions/IbusSwitcher")
	}

	disable() {
		if (this.timer) {
			clearInterval(this.timer)
		}
		this.timer = null
		if (this._dbus) {
			this._dbus.flush()
			this._dbus.unexport()
		}
		this._dbus = null
		this._inputSourceManager = null
		this._ibusManager = null
	}

	/**
	 * @returns {[number, string]}
	 */
	get currentSource() {
		let { currentSource } = this._inputSourceManager
		let { index, properties } = currentSource
		let mode = this.getMode(properties)
		return [index, mode]
	}

	async SwitchSourceAsync([index, mode], invocation) {
		let { inputSources } = this._inputSourceManager
		let [oldIndex, oldMode] = this.currentSource
		if (index != oldIndex) {
			inputSources[index].activate()
		}
		if (mode != oldMode) {
			let cnt = 1
			let modeChanged
			await this.waitUntil(() => {
				let [curIndex, curMode] = this.currentSource
				if (index != curIndex) {
					return true
				}
				modeChanged = mode !== curMode
				return modeChanged || cnt++ > 6
			})
			if (modeChanged) {
				this.setMode(inputSources[index].properties, mode)
			}
		}
		invocation.return_value(GLib.Variant.new('(s)', [`${oldIndex}|${oldMode}`]))
	}

	CurrentSource() {
		let [index, mode] = this.currentSource
		return `${index}|${mode}`
	}

	SourceSize() {
		return Object.keys(this._inputSourceManager.inputSources).length
	}
}

function init() {
	return new Extension()
}

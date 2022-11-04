# ibus-switcher

A gnome shell extension to use d-bus to switch ibus source.

## Table of contents

- [Table of contents](#table-of-contents)
- [Features](#features)
- [Quickstart](#quickstart)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [The most recent official release from extensions.gnome.org](#the-most-recent-official-release-from-extensions.gnome.org)
    - [From source](#from-source)
  - [Usage](#usage)
    - [d-bus methods](#d-bus-methods)
    - [Use `dbus-send` as example](#use-`dbus-send`-as-example)
- [Feedback](#feedback)
- [License](#license)

## Features

- Switch ibus input method via d-bus
- Support to switch different InputMode in same source

## Quickstart

### Requirements

- gnome-shell 42 or later

> Run `gnome-shell --version` in command line to check version.

### Installation

#### The most recent official release from extensions.gnome.org

[Visit Ibus-Swither at GNOME Extensions](https://extensions.gnome.org/extension/5494/ibus-switcher/)

#### From source

1. `git clone https://github.com/kevinhwang91/gnome-shell-ibus-switcher.git`
2. `make install`

### Usage

#### d-bus methods

- org.gnome.Shell.Extensions.IbusSwitcher.SourceSize

Get size of input methods, return a `unit32` value.

- org.gnome.Shell.Extensions.IbusSwitcher.CurrentSource

Get current input method, return a `string` value, concatenat index and mode with `|` delimiter.

- org.gnome.Shell.Extensions.IbusSwitcher.SwitchSource

Switch input method with index (`unit32` type) and mode (`string` type) as parameters, return a
`string` value, which is old value of `CurrentSource` method.

#### Use `dbus-send` as example

- Get current input method

`dbus-send --session --type=method_call --print-reply=literal --dest=org.gnome.Shell /org/gnome/Shell/Extensions/IbusSwitcher org.gnome.Shell.Extensions.IbusSwitcher.CurrentSource`

- Switch input method

`dbus-send --session --type=method_call --print-reply=literal --dest=org.gnome.Shell /org/gnome/Shell/Extensions/IbusSwitcher org.gnome.Shell.Extensions.IbusSwitcher.SwitchSource uint32:1 string:中`

## Feedback

- If you get an issue or come up with an awesome idea, don't hesitate to open an issue in github.
- If you think this plugin is useful or cool, consider rewarding it a star.

## License

The project is licensed under a BSD-3-clause license. See [LICENSE](./LICENSE) file for details.

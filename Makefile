UUID = ibus-switcher@kevinhwang91.github.com
FILES = extension.js metadata.json LICENSE README.md

ifeq ($(strip $(DESTDIR)),)
	DIR_BASE = $(HOME)/.local/share/gnome-shell/extensions
else
	DIR_BASE = $(DESTDIR)/usr/share/gnome-shell/extensions
endif
DIR_PATH = $(DIR_BASE)/$(UUID)
BUILD_FILES := $(addprefix build/,$(FILES))

# The command line passed variable VERSION is used to set the version string
# in the metadata and in the generated zip-file. If no VERSION is passed, the
# version is pulled from the latest git tag and the current commit SHA1 is
# added to the metadata
ifdef VERSION
    ifdef TARGET
		FILE_SUFFIX = _v$(VERSION)_$(TARGET)
	else
		FILE_SUFFIX = _v$(VERSION)
	endif
else
	LATEST_TAG = $(shell git describe --match "v[0-9]*" --abbrev=0 --tags HEAD)
	VERSION = $(LATEST_TAG:v%=%)
	COMMIT = $(shell git rev-parse HEAD)
	FILE_SUFFIX =
endif

all: build

build: mkdir_build $(BUILD_FILES) metadata

mkdir_build:
	@mkdir -p build

$(BUILD_FILES): build/%: %
	cp $< $@

metadata: build/metadata.json
ifneq ($(and $(COMMIT),$(VERSION)),)
	@sed -i 's/"version": [[:digit:]][[:digit:]]*/"version": "$(VERSION)",\n\t"commit": "$(COMMIT)"/'  build/metadata.json;
else ifneq ($(VERSION),)
	@sed -i 's/"version": [[:digit:]][[:digit:]]*/"version": "$(VERSION)"/'  build/metadata.json;
endif

install: build
	rm -rf $(DIR_PATH)
	mkdir -p $(DIR_PATH)
	cp -r build/* $(DIR_PATH)/

zip: build
	cd build ; \
	zip -qr "$(UUID)$(FILE_SUFFIX).zip" .
	mv build/$(UUID)$(FILE_SUFFIX).zip ./

clean:
	rm -rf build


.PHONY: all build mkdir_build clean zip lint metadata

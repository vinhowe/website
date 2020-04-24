#!/usr/bin/env bash

./build_wasm.sh
gatsby build
firebase deploy --only hosting

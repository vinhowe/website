#!/usr/bin/env bash

cd $(dirname $0)
wasm-pack build --target web && wasm-opt -O3 -o pkg/the_show_stops_wasm_bg.wasm pkg/the_show_stops_wasm_bg.wasm

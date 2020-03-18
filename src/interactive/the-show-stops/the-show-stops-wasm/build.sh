#!/usr/bin/env bash

wasm-pack build --target web && wasm-opt -O3 -o pkg/the_show_stops_wasm_bg.wasm pkg/the_show_stops_wasm_bg.wasm

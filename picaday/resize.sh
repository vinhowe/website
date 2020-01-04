#!/bin/env bash

mogrify -path ./scaled -format jpg -resize "1000>" *.jpg

#!/bin/env bash

mogrify -path ./out -format jpg -resize "1000>" *.jpg

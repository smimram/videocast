#!/bin/env -S liquidsoap

s = input.harbor("mount", port=8080)
output.graphics(fallible=true, s)
output(fallible=true, s)

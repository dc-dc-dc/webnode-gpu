FROM docker.io/ubuntu:22.04 AS base

RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y python3 curl sudo build-essential pkg-config git libx11-xcb-dev libxrandr-dev libgl-dev libxcursor-dev libxinerama-dev libxi-dev ninja-build
RUN apt-get autoclean
WORKDIR /cmake

RUN curl -L https://github.com/Kitware/CMake/releases/download/v3.27.0-rc3/cmake-3.27.0-rc3-linux-x86_64.sh -o /cmake/cmake.sh
RUN bash /cmake/cmake.sh --skip-license

RUN apt-get autoclean

WORKDIR /depot-tools

ENV DEPOT_TOOLS_UPDATE=0
ENV DEPOT_TOOLS_WIN_TOOLCHAIN=0

RUN git clone --depth=1 https://chromium.googlesource.com/chromium/tools/depot_tools.git /depot_tools

WORKDIR /dawn

RUN git clone --depth=1 https://dawn.googlesource.com/dawn /dawn 

RUN cp /dawn/scripts/standalone.gclient /dawn/.gclient

ENV PATH="/cmake/bin:/depot_tools:${PATH}"

RUN gclient sync --no-history -j$(nproc)

RUN mkdir /dawn/out
WORKDIR /dawn/out
RUN cmake -GNinja ../ -DCMAKE_BUILD_TYPE=Release -DDAWN_BUILD_SAMPLES=0 -DDAWN_BUILD_TESTS=0
RUN ninja -j$(nproc) dawn.so
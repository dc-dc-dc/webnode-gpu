cmake_minimum_required(VERSION 3.19)
cmake_policy(SET CMP0042 NEW)

project(nodegpu)

find_package(Git)
set(depdir ${CMAKE_BINARY_DIR})

function (fetchdep name repo commit)
  if (NOT EXISTS ${depdir}/${name})
    execute_process(COMMAND ${GIT_EXECUTABLE} clone -n ${repo} ${name}
      WORKING_DIRECTORY ${depdir})
  endif()
  execute_process(
    COMMAND ${GIT_EXECUTABLE} checkout ${commit}
    WORKING_DIRECTORY ${depdir}/${name})   
endfunction()

fetchdep(dawn https://dawn.googlesource.com/dawn.git HEAD)
# fetchdep(depot https://chromium.googlesource.com/chromium/tools/depot_tools.git HEAD)

configure_file(${depdir}/dawn/scripts/standalone-with-node.gclient ${depdir}/dawn/.gclient COPYONLY)
add_custom_target(gclient ALL 
    COMMAND gclient sync
    WORKING_DIRECTORY ${depdir}/dawn)
# set(DAWN_BUILD_NODE_BINDINGS ON)
# set(DAWN_BUILD_SAMPLES OFF)
# set(CMAKE_BUILD_TYPE Release)
# set(CMAKE_CONFIGURATION_TYPES Release)

add_custom_target(build-time-make-directory ALL
    COMMAND ${CMAKE_COMMAND} -E make_directory ${depdir}/dawn/out/
    DEPENDS gclient)

add_custom_target(build-dawn ALL 
    COMMAND ${CMAKE_COMMAND} ../ -GNinja -DDAWN_BUILD_NODE_BINDINGS=1 -DTINT_BUILD_SAMPLES=0 -DTINT_BUILD_TESTS=0 -DDAWN_BUILD_SAMPLES=0 -DCMAKE_BUILD_TYPE=Release
    WORKING_DIRECTORY ${depdir}/dawn/out/
    DEPENDS build-time-make-directory)

add_custom_target(build-dawn-node ALL
    COMMAND ${CMAKE_COMMAND} --build . --target dawn_node
    WORKING_DIRECTORY ${depdir}/dawn/out/
    DEPENDS build-dawn)

add_custom_target(move-dawn-node ALL
    COMMAND ${CMAKE_COMMAND} -E copy ${depdir}/dawn/out/dawn.node ${CMAKE_SOURCE_DIR}/dawn.node
    DEPENDS build-dawn-node)
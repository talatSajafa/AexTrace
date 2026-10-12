#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "core/interpreter.hpp"
#include "core/memory_model.hpp"

using namespace emscripten;
using namespace aextrace;

val cellToVal(const MemoryCell& cell) {
    val obj = val::object();
    obj.set("address",   (double)cell.address);
    obj.set("region",    (int)cell.region);
    obj.set("varName",   cell.varName);
    obj.set("typeName",  cell.typeName);
    obj.set("rawValue",  cell.rawValue);
    obj.set("isPointer", cell.isPointer);
    obj.set("pointsTo",  (double)cell.pointsTo);
    obj.set("isLive",    cell.isLive);
    return obj;
}

val frameToVal(const TraceFrame& frame) {
    val obj = val::object();
    obj.set("frameId",      frame.frameId);
    obj.set("lineNumber",   frame.lineNumber);
    obj.set("functionName", frame.functionName);
    obj.set("stepNote",     frame.stepNote);

    val stack = val::array();
    for (size_t i = 0; i < frame.stackCells.size(); i++) {
        stack.set(i, cellToVal(frame.stackCells[i]));
    }
    obj.set("stackCells", stack);

    val heap = val::array();
    for (size_t i = 0; i < frame.heapCells.size(); i++) {
        heap.set(i, cellToVal(frame.heapCells[i]));
    }
    obj.set("heapCells", heap);

    val regs = val::array();
    for (size_t i = 0; i < frame.registers.size(); i++) {
        regs.set(i, cellToVal(frame.registers[i]));
    }
    obj.set("registers", regs);

    return obj;
}

val runCode(const std::string& source) {
    Interpreter interp;
    auto frames = interp.run(source);

    val result = val::array();
    for (size_t i = 0; i < frames.size(); i++) {
        result.set(i, frameToVal(frames[i]));
    }
    return result;
}

int add(int a, int b) {
    return a + b;
}

EMSCRIPTEN_BINDINGS(aextrace_engine) {
    emscripten::function("add",     &add);
    emscripten::function("runCode", &runCode);
}
#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace aextrace {

enum class MemRegion : uint8_t {
    Stack,
    Heap,
    Static,
    Register
};

struct MemoryCell {
    uintptr_t   address;
    MemRegion   region;
    std::string varName;
    std::string typeName;
    std::string rawValue;
    bool        isPointer;
    uintptr_t   pointsTo;
    bool        isLive;

    MemoryCell()
        : address(0), region(MemRegion::Stack),
          isPointer(false), pointsTo(0), isLive(true) {}
};

struct TraceFrame {
    uint32_t               frameId;
    uint32_t               lineNumber;
    std::string            functionName;
    std::string            stepNote;   // short human-readable explanation
    std::vector<MemoryCell> stackCells;
    std::vector<MemoryCell> heapCells;
    std::vector<MemoryCell> registers;

    TraceFrame() : frameId(0), lineNumber(0) {}
};

} // namespace aextrace
#pragma once
#include "memory_model.hpp"
#include <string>
#include <vector>

namespace aextrace {

class Interpreter {
public:
    Interpreter();

    // Run full program, return all frames
    std::vector<TraceFrame> run(const std::string& source);

    // Reset state
    void reset();

private:
    uintptr_t nextAddress_;
    uint32_t  nextFrameId_;

    uintptr_t allocate(int size);
    std::string toHex(uintptr_t addr) const;
};

} // namespace aextrace
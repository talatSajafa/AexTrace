#pragma once
#include "memory_model.hpp"
#include <vector>

namespace aextrace {

class Tracer {
public:
    explicit Tracer(size_t maxFrames = 200);

    void addFrame(const TraceFrame& frame);
    const TraceFrame* getFrame(size_t index) const;
    size_t size() const;
    void clear();

private:
    std::vector<TraceFrame> frames_;
    size_t maxFrames_;
};

} // namespace aextrace
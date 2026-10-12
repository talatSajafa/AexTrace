#include "tracer.hpp"

namespace aextrace {

Tracer::Tracer(size_t maxFrames) : maxFrames_(maxFrames) {}

void Tracer::addFrame(const TraceFrame& frame) {
    if (frames_.size() >= maxFrames_) {
        frames_.erase(frames_.begin());
    }
    frames_.push_back(frame);
}

const TraceFrame* Tracer::getFrame(size_t index) const {
    if (index >= frames_.size()) return nullptr;
    return &frames_[index];
}

size_t Tracer::size() const {
    return frames_.size();
}

void Tracer::clear() {
    frames_.clear();
}

} // namespace aextrace
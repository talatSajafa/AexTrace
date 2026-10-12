#include "interpreter.hpp"
#include <sstream>
#include <cctype>
#include <algorithm>

namespace aextrace {

Interpreter::Interpreter() : nextAddress_(0x1000), nextFrameId_(1) {}

void Interpreter::reset() {
    nextAddress_ = 0x1000;
    nextFrameId_ = 1;
}

uintptr_t Interpreter::allocate(int size) {
    uintptr_t addr = nextAddress_;
    nextAddress_ += static_cast<uintptr_t>(size);
    return addr;
}

std::string Interpreter::toHex(uintptr_t addr) const {
    std::stringstream ss;
    ss << "0x" << std::hex << addr;
    return ss.str();
}

std::vector<TraceFrame> Interpreter::run(const std::string& source) {
    reset();

    std::vector<TraceFrame> frames;
    std::vector<MemoryCell> stack;

    std::istringstream iss(source);
    std::string line;
    uint32_t lineNo = 0;

    auto trim = [](std::string s) {
        auto a = s.find_first_not_of(" \t\r\n");
        auto b = s.find_last_not_of(" \t\r\n");
        if (a == std::string::npos) return std::string();
        return s.substr(a, b - a + 1);
    };

    while (std::getline(iss, line)) {
        lineNo++;

        auto start = line.find_first_not_of(" \t\r\n");
        if (start == std::string::npos) continue;
        auto end = line.find_last_not_of(" \t\r\n;");
        if (end == std::string::npos) continue;
        std::string trimmed = line.substr(start, end - start + 1);

        if (trimmed.empty()) continue;
        if (trimmed.rfind("//", 0) == 0) continue;

        std::string stepNote = "";

        size_t eqPos = trimmed.find('=');
        if (eqPos != std::string::npos) {
            std::string lhs = trim(trimmed.substr(0, eqPos));
            std::string rhs = trim(trimmed.substr(eqPos + 1));

            bool isPtr = lhs.find('*') != std::string::npos;
            std::string typeName;
            std::string varName;

            if (isPtr) {
                size_t starPos = lhs.find('*');
                typeName = trim(lhs.substr(0, starPos)) + "*";
                varName = trim(lhs.substr(starPos + 1));
            } else {
                size_t spacePos = lhs.find(' ');
                if (spacePos != std::string::npos) {
                    typeName = trim(lhs.substr(0, spacePos));
                    varName = trim(lhs.substr(spacePos + 1));
                } else {
                    typeName = "int";
                    varName = lhs;
                }
            }

            if (varName.empty()) continue;

            MemoryCell cell;
            cell.varName  = varName;
            cell.typeName = typeName;
            cell.region   = MemRegion::Stack;
            cell.isLive   = true;

            if (isPtr) {
                cell.isPointer = true;
                cell.address   = allocate(8);

                if (!rhs.empty() && rhs[0] == '&') {
                    std::string target = trim(rhs.substr(1));
                    for (const auto& existing : stack) {
                        if (existing.varName == target) {
                            cell.pointsTo = existing.address;
                            break;
                        }
                    }
                    cell.rawValue = toHex(cell.pointsTo);
                    stepNote = "Declared pointer '" + varName + "' pointing to '" + target + "' at " + toHex(cell.pointsTo);
                } else if (rhs == "nullptr" || rhs == "NULL" || rhs == "0") {
                    cell.pointsTo = 0;
                    cell.rawValue = "null";
                    stepNote = "Declared pointer '" + varName + "' set to null";
                } else {
                    cell.rawValue = rhs;
                    stepNote = "Declared pointer '" + varName + "'";
                }
            } else {
                cell.isPointer = false;
                cell.address   = allocate(4);
                cell.rawValue  = rhs;
                stepNote = "Declared " + typeName + " '" + varName + "' = " + rhs;
            }

            bool found = false;
            for (auto& existing : stack) {
                if (existing.varName == varName) {
                    existing = cell;
                    found = true;
                    break;
                }
            }
            if (!found) stack.push_back(cell);
        }
        else if (trimmed[0] == '*') {
            size_t eq = trimmed.find('=');
            if (eq != std::string::npos) {
                std::string target = trim(trimmed.substr(1, eq - 1));
                std::string value  = trim(trimmed.substr(eq + 1));

                for (auto& cell : stack) {
                    if (cell.varName == target && cell.isPointer && cell.pointsTo != 0) {
                        for (auto& target_cell : stack) {
                            if (target_cell.address == cell.pointsTo) {
                                std::string oldVal = target_cell.rawValue;
                                target_cell.rawValue = value;
                                stepNote = "Wrote " + value + " through pointer '" + target +
                                           "' into '" + target_cell.varName + "' (was " + oldVal + ")";
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }

        if (stepNote.empty()) {
            stepNote = "Executed line " + std::to_string(lineNo);
        }

        TraceFrame frame;
        frame.frameId      = nextFrameId_++;
        frame.lineNumber   = lineNo;
        frame.functionName = "main";
        frame.stepNote     = stepNote;
        frame.stackCells   = stack;
        frame.heapCells    = {};
        frame.registers    = {};
        frames.push_back(frame);
    }

    return frames;
}

} // namespace aextrace
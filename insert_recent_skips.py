# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/live-monitor/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      minutesOn = Math.max(0, minutesOn + timeAdjustment);

      return {"""

replacement = """      minutesOn = Math.max(0, minutesOn + timeAdjustment);

      const timeWindowStartSkip = new Date(nowMs - (op.maxSkipMins || 60) * 60 * 1000);
      let recentSkips = 0;
      for (const log of op.activityLogs) {
        if (log.action === "OUTCOME_SKIP" && new Date(log.createdAt).getTime() >= timeWindowStartSkip.getTime()) {
          recentSkips++;
        }
      }

      return {"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
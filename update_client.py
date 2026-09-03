# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/monitoring/live/LiveMonitorClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    isIdle: boolean;
    isDisconnected: boolean;
    skipCount: number;
    currentContact: {"""

replacement = """    isIdle: boolean;
    isDisconnected: boolean;
    recentSkips: number;
    maxSkip: number;
    currentContact: {"""

code = code.replace(target, replacement)

target2 = """                      <td className="px-2 py-3 text-center text-gray-400 font-semibold">
                        {op.stats.skip}
                        {op.skipCount > 0 && (
                          <span className="text-xs text-amber-500 font-bold block mt-0.5" title="Skip consecutivi (blocco a 5)">
                            ({op.skipCount}/5)
                          </span>
                        )}
                      </td>"""

replacement2 = """                      <td className="px-2 py-3 text-center text-gray-400 font-semibold">
                        {op.stats.skip}
                        {op.recentSkips > 0 && (
                          <span className="text-xs text-amber-500 font-bold block mt-0.5" title={`Skip consecutivi (blocco a ${op.maxSkip})`}>
                            ({op.recentSkips}/{op.maxSkip})
                          </span>
                        )}
                      </td>"""

code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
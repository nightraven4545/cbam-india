"use client";

import { IssueTree, Gantt, type INode, type GRow } from "@/components/consulting/charts";

export function Tree({ root }: { root: INode }) { return <IssueTree root={root} />; }
export function Plan({ rows }: { rows: GRow[] }) { return <Gantt rows={rows} weeks={6} />; }

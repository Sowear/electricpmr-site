const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(/} from "lucide-react";/, '  Trash2,\n} from "lucide-react";');
code = code.replace('useProjects,\n  type ProjectObject,\n} from "@/hooks/useProjects";', 'useProjects,\n  useProjectKpi,\n  useDeleteProjectObject,\n  type ProjectObject,\n} from "@/hooks/useProjects";');
code = code.replace('useProjects,\r\n  type ProjectObject,\r\n} from "@/hooks/useProjects";', 'useProjects,\n  useProjectKpi,\n  useDeleteProjectObject,\n  type ProjectObject,\n} from "@/hooks/useProjects";');

code = code.replace('const createProjectObject = useCreateProjectObject();', 'const createProjectObject = useCreateProjectObject();\n  const deleteProjectObject = useDeleteProjectObject();');

const regex = new RegExp('const kpi = useMemo\\(\\(\\) => \\{[\\s\\S]*?\\}, \\[financeEntries, estimates, objects\\]\\);');
const newKpi = `const { data: kpiData } = useProjectKpi(projectId);

  const kpi = kpiData || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeEstimates: 0,
    objectsCount: 0,
  };`;
code = code.replace(regex, newKpi);

const oldBadge = `<Badge variant="outline">{obj.status}</Badge>`;
const newBadge = `<div className="flex items-center gap-2">
                            <Badge variant="outline">{obj.status}</Badge>
                            {canManageEstimates && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Удалить этот объект? Связанные данные (сметы, платежи) могут потерять привязку.")) {
                                    deleteProjectObject.mutate({ objectId: obj.id, projectId: projectId });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>`;
code = code.replace(oldBadge, newBadge);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
console.log('done');

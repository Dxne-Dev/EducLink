import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { PageHeader, type PageHeaderCrumb } from '@/components/layout/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/EmptyState'

export interface ListPageColumn<T> {
  header: string
  accessor?: keyof T
  className?: string
  render?: (value: any, row: T) => React.ReactNode
}

export interface ListPageShellProps<T> {
  breadcrumb: PageHeaderCrumb[]
  title: string
  subtitle?: string
  columns: ListPageColumn<T>[]
  data: T[]
  emptyState: {
    title: string
    description: string
    icon?: React.ReactNode
  }
  formSlot?: React.ReactNode
  formTitle?: string
  formDescription?: string
  headerActions?: React.ReactNode
  renderActions?: (row: T) => React.ReactNode
}

export function ListPageShell<T>({
  breadcrumb,
  title,
  subtitle,
  columns,
  data,
  emptyState,
  formSlot,
  formTitle = 'Ajouter',
  formDescription,
  headerActions,
  renderActions,
}: ListPageShellProps<T>) {
  const hasForm = Boolean(formSlot)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        subtitle={subtitle}
        actions={headerActions}
      />

      <div className={hasForm ? 'grid gap-6 lg:grid-cols-3' : 'space-y-6'}>
        <div className={hasForm ? 'lg:col-span-2' : ''}>
          <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-title text-ink dark:text-slate-100">
                  Liste des {title.toLowerCase()}
                </CardTitle>
                <CardDescription className="text-caption text-ink-muted dark:text-slate-400 mt-1">
                  {data?.length ?? 0} {data?.length === 1 ? 'enregistrement' : 'enregistrements'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {data && data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-hairline dark:border-slate-800 hover:bg-transparent">
                        {columns.map((col) => (
                          <TableHead
                            key={col.header}
                            className={`text-caption font-semibold text-ink-secondary dark:text-slate-300 py-3 ${col.className ?? ''}`}
                          >
                            {col.header}
                          </TableHead>
                        ))}
                        {renderActions && (
                          <TableHead className="text-right text-caption font-semibold text-ink-secondary dark:text-slate-300 py-3 w-28">
                            Actions
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-hairline dark:border-slate-800/60 transition-colors hover:bg-canvas-soft/70 dark:hover:bg-slate-800/40"
                        >
                          {columns.map((col) => (
                            <TableCell
                              key={col.header}
                              className={`py-3.5 text-body-sm text-ink dark:text-slate-200 ${col.className ?? ''}`}
                            >
                              {col.render
                                ? col.render(col.accessor ? row[col.accessor] : undefined, row)
                                : col.accessor
                                ? String(row[col.accessor] ?? '—')
                                : null}
                            </TableCell>
                          ))}
                          {renderActions && (
                            <TableCell className="text-right py-3.5">
                              <div className="flex items-center justify-end gap-1">
                                {renderActions(row)}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8">
                  <EmptyState
                    icon={emptyState.icon}
                    title={emptyState.title}
                    description={emptyState.description}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {hasForm && (
          <div>
            <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-title text-ink dark:text-slate-100">
                  {formTitle}
                </CardTitle>
                {formDescription && (
                  <CardDescription className="text-caption text-ink-muted dark:text-slate-400 mt-1">
                    {formDescription}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {formSlot}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
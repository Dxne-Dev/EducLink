import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { PageHeader, type PageHeaderCrumb } from '@/components/layout/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/EmptyState'

interface ListPageShellProps<T> {
  breadcrumb: PageHeaderCrumb[]
  title: string
  subtitle?: string
  columns: Array<{
    header: string
    accessor: keyof T
    render?: (value: any, row: T) => React.ReactNode
  }>
  data: T[]
  emptyState: {
    title: string
    description: string
  }
  createHref: string
  createLabel: string
  createIcon: React.ReactNode
}

export function ListPageShell<T>({
  breadcrumb,
  title,
  subtitle,
  columns,
  data,
  emptyState,
  createHref,
  createLabel,
  createIcon,
}: ListPageShellProps<T>) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} title={title} subtitle={subtitle} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">{title}</CardTitle>
              <div className="flex items-center justify-between mt-2">
                <span className="text-body-sm text-ink-muted">
                  {data?.length ?? 0} {data?.length === 1 ? 'élément' : 'éléments'}
                </span>
                <Link href={createHref} className="btn btn-primary">
                  {createIcon}
                  <span className="ml-2">{createLabel}</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data && data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.header} className="text-left">
                          {col.header}
                        </TableHead>
                      ))}
                      <TableHead className="text-right w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index} className="hover:bg-canvas-soft">
                        {columns.map((col) => (
                          <TableCell key={col.header} className="py-4">
                            {col.render
                              ? col.render(row[col.accessor], row)
                              : String(row[col.accessor])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right py-4">
                          {/* Actions dropdown would go here */}
                          <div className="flex items-center gap-2">
                            <Button variant="utility" size="icon" title="Éditer">
                              {/* Edit icon */}
                            </Button>
                            <Button variant="utility" size="icon" title="Supprimer">
                              {/* Delete icon */}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title={emptyState.title}
                  description={emptyState.description}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Créer un nouvel élément</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form would go here - to be implemented per entity */}
              <div className="text-center py-8">
                <p className="text-body-sm text-ink-muted">
                  Utilisez le bouton "Nouveau {createLabel.toLowerCase()}" ci-dessus pour accéder au formulaire de création.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useRouter } from 'next/router';

import { getRecharge, getRechargeStat } from '@/apis/clientApis';
import ExportButton from '@/components/Button/ExportButtom';
import { IconRefresh } from '@/components/Icons';
import DateTimePopover from '@/components/Popover/DateTimePopover';
import Tips from '@/components/Tips/Tips';
import {
  UNIFIED_TABLE_PAGE_SIZE,
  UnifiedColumnSelector,
  UnifiedTable,
  UnifiedTableColumn,
  buildColumnQuery,
  getFirstQueryValue,
  parseColumnQuery,
  parseQueryPage,
} from '@/components/table/UnifiedTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableCell,
  TableFooter,
  TableRow,
} from '@/components/ui/table';
import { useTextFilterDraft } from '@/components/table/useTextFilterDraft';
import useTranslation from '@/hooks/useTranslation';
import {
  GetRechargeParams,
  GetRechargeResult,
  GetRechargeStatResult,
  RechargeTransactionType,
  RechargeTransactionTypeId,
} from '@/types/clientApis';
import { PageResult } from '@/types/page';
import { toFixed } from '@/utils/common';
import { formatDate, formatDateTime, getTz } from '@/utils/date';
import { getUserSession } from '@/utils/user';
import { cn } from '@/lib/utils';

type RechargeTableMode = 'user' | 'admin';

type RechargeTableFilters = {
  type: string;
  start: string;
  end: string;
  user: string;
  creditUser: string;
};

type TextFilters = Pick<RechargeTableFilters, 'user' | 'creditUser'>;

type RechargeColumnKey = 'date' | 'account' | 'type' | 'amount' | 'operator';

export interface RechargeTableProps {
  mode: RechargeTableMode;
}

const formatDateParam = (date: Date) => formatDate(date.toLocaleDateString());

const formatAmount = (amount: number) => {
  const formatted = toFixed(amount);
  return amount > 0 ? `+${formatted}` : formatted;
};

const pickTextFilters = (filters: RechargeTableFilters): TextFilters => ({
  user: filters.user,
  creditUser: filters.creditUser,
});

const parseRechargeType = (value: string): RechargeTransactionTypeId | undefined => {
  if (value === String(RechargeTransactionType.AdminCharge)) {
    return RechargeTransactionType.AdminCharge;
  }
  if (value === String(RechargeTransactionType.Initial)) {
    return RechargeTransactionType.Initial;
  }
  return undefined;
};

const buildRechargeQuery = (
  mode: RechargeTableMode,
  page: number,
  filters: RechargeTableFilters,
  columns: RechargeColumnKey[],
  defaultColumns: RechargeColumnKey[],
) => {
  const query: Record<string, string> = {};

  if (mode === 'user') {
    query.t = 'recharge';
  }

  if (page > 1) {
    query.page = page.toString();
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.start) {
    query.start = filters.start;
  }

  if (filters.end) {
    query.end = filters.end;
  }

  if (mode === 'admin' && filters.user) {
    query.user = filters.user;
  }

  if (mode === 'admin' && filters.creditUser) {
    query['credit-user'] = filters.creditUser;
  }

  const columnsQuery = buildColumnQuery(columns, defaultColumns);
  if (columnsQuery) {
    query.columns = columnsQuery;
  }

  return query;
};

const RechargeTable = ({ mode }: RechargeTableProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [rows, setRows] = useState<GetRechargeResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<GetRechargeStatResult>({
    count: 0,
    sumAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RechargeTableFilters>({
    type: '',
    start: '',
    end: '',
    user: '',
    creditUser: '',
  });
  const lastFetchKeyRef = useRef('');

  const formatType = useCallback(
    (typeId: number) => {
      if (typeId === RechargeTransactionType.AdminCharge) {
        return t('Admin recharge');
      }
      if (typeId === RechargeTransactionType.Initial) {
        return t('Initial credit');
      }
      return t('Unknown');
    },
    [t],
  );

  const allColumns = useMemo<UnifiedTableColumn<GetRechargeResult, RechargeColumnKey>[]>(
    () => {
      const columns: UnifiedTableColumn<GetRechargeResult, RechargeColumnKey>[] = [
        {
          key: 'date',
          title: t('Date'),
          cell: (row) => formatDateTime(row.createdAt),
        },
      ];

      if (mode === 'admin') {
        columns.push({
          key: 'account',
          title: t('Account'),
          cell: (row) => row.userName,
        });
      }

      columns.push(
        {
          key: 'type',
          title: t('Transaction Type'),
          cell: (row) => formatType(row.transactionTypeId),
        },
        {
          key: 'amount',
          title: t('Credit Amount'),
          cell: (row) => (
            <span
              className={cn(
                'tabular-nums',
                row.amount < 0 ? 'text-red-500' : 'text-emerald-600',
              )}
            >
              {formatAmount(row.amount)}
            </span>
          ),
        },
        {
          key: 'operator',
          title: t('Operator'),
          cell: (row) => row.creditUserName,
        },
      );

      return columns;
    },
    [formatType, mode, t],
  );

  const defaultColumns = useMemo<RechargeColumnKey[]>(
    () => allColumns.map((column) => column.key),
    [allColumns],
  );
  const [selectedColumns, setSelectedColumns] =
    useState<RechargeColumnKey[]>(defaultColumns);

  const visibleColumns = useMemo(
    () => allColumns.filter((column) => selectedColumns.includes(column.key)),
    [allColumns, selectedColumns],
  );

  const pushQuery = useCallback(
    (
      nextPage: number,
      nextFilters: RechargeTableFilters,
      nextColumns: RechargeColumnKey[],
    ) => {
      if (!router.isReady) {
        return;
      }

      router.push(
        {
          pathname: router.pathname,
          query: buildRechargeQuery(
            mode,
            nextPage,
            nextFilters,
            nextColumns,
            defaultColumns,
          ),
        },
        undefined,
        { shallow: true },
      );
    },
    [defaultColumns, mode, router],
  );

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextFilters: RechargeTableFilters = {
      type: getFirstQueryValue(router.query.type) || '',
      start: getFirstQueryValue(router.query.start) || '',
      end: getFirstQueryValue(router.query.end) || '',
      user: getFirstQueryValue(router.query.user) || '',
      creditUser: getFirstQueryValue(router.query['credit-user']) || '',
    };
    const nextPage = parseQueryPage(
      getFirstQueryValue(router.query.page) || getFirstQueryValue(router.query.p),
    );
    const nextColumns = parseColumnQuery(
      getFirstQueryValue(router.query.columns),
      allColumns,
      defaultColumns,
    );

    setPage((prev) => (prev === nextPage ? prev : nextPage));
    setFilters((prev) =>
      JSON.stringify(prev) === JSON.stringify(nextFilters) ? prev : nextFilters,
    );
    setSelectedColumns((prev) =>
      prev.join(',') === nextColumns.join(',') ? prev : nextColumns,
    );
  }, [allColumns, defaultColumns, router.isReady, router.query]);

  const getRechargeParams = useCallback(
    (currentPage: number, currentFilters: RechargeTableFilters): GetRechargeParams => ({
      user: mode === 'admin' ? currentFilters.user || undefined : undefined,
      creditUser:
        mode === 'admin' ? currentFilters.creditUser || undefined : undefined,
      type: parseRechargeType(currentFilters.type),
      start: currentFilters.start || undefined,
      end: currentFilters.end || undefined,
      page: currentPage,
      pageSize: UNIFIED_TABLE_PAGE_SIZE,
      tz: getTz(),
    }),
    [mode],
  );

  const refresh = useCallback(
    (force = false) => {
      if (!router.isReady) {
        return;
      }

      const params = getRechargeParams(page, filters);
      const fetchKey = JSON.stringify(params);
      if (!force && fetchKey === lastFetchKeyRef.current) {
        return;
      }

      lastFetchKeyRef.current = fetchKey;
      setLoading(true);

      Promise.all([
        getRecharge(params).then((result: PageResult<GetRechargeResult[]>) => {
          setRows(result.rows);
          setTotalCount(result.count);
        }),
        getRechargeStat({ ...params, page: undefined, pageSize: undefined }).then(
          (result) => {
            setStats(result);
          },
        ),
      ])
        .catch((error) => {
          console.error(error);
          toast.error(
            t(
              'Operation failed, Please try again later, or contact technical personnel',
            ),
          );
          lastFetchKeyRef.current = '';
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [filters, getRechargeParams, page, router.isReady, t],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { draft, setDraft, flushDraft, hasPendingDraft } = useTextFilterDraft({
    committed: pickTextFilters(filters),
    onCommit: (nextTextFilters) => {
      pushQuery(
        1,
        {
          ...filters,
          ...nextTextFilters,
        },
        selectedColumns,
      );
    },
  });

  const updateImmediateFilter = (partial: Partial<RechargeTableFilters>) => {
    const nextFilters = { ...filters, ...draft, ...partial };
    pushQuery(1, nextFilters, selectedColumns);
  };

  const updateTextFilter = (partial: Partial<TextFilters>) => {
    setDraft((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const toggleColumn = (key: RechargeColumnKey, checked: boolean) => {
    const nextSet = new Set(selectedColumns);
    if (checked) {
      nextSet.add(key);
    } else {
      nextSet.delete(key);
      if (nextSet.size === 0) {
        return;
      }
    }

    const nextColumns = allColumns
      .map((column) => column.key)
      .filter((columnKey) => nextSet.has(columnKey));

    pushQuery(
      page,
      {
        ...filters,
        ...draft,
      },
      nextColumns,
    );
  };

  const exportParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      token: getUserSession(),
      tz: getTz(),
      user: mode === 'admin' ? filters.user || undefined : undefined,
      'credit-user':
        mode === 'admin' ? filters.creditUser || undefined : undefined,
      type: parseRechargeType(filters.type),
      start: filters.start || undefined,
      end: filters.end || undefined,
    };

    return params;
  }, [filters, mode]);

  return (
    <UnifiedTable
      filters={
        <>
          <div className="w-[180px]">
            <Select
              value={filters.type}
              onValueChange={(value) => updateImmediateFilter({ type: value })}
            >
              <SelectTrigger
                className="w-full"
                value={filters.type}
                onReset={() => updateImmediateFilter({ type: '' })}
              >
                <SelectValue placeholder={t('Select Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(RechargeTransactionType.AdminCharge)}>
                  {t('Admin recharge')}
                </SelectItem>
                <SelectItem value={String(RechargeTransactionType.Initial)}>
                  {t('Initial credit')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'admin' && (
            <Input
              className="w-[180px] placeholder:text-neutral-400"
              placeholder={t('Account')}
              value={draft.user}
              onChange={(event) =>
                updateTextFilter({ user: event.target.value })
              }
            />
          )}

          {mode === 'admin' && (
            <Input
              className="w-[180px] placeholder:text-neutral-400"
              placeholder={t('Operator')}
              value={draft.creditUser}
              onChange={(event) =>
                updateTextFilter({ creditUser: event.target.value })
              }
            />
          )}

          <DateTimePopover
            value={filters.start}
            className="w-[180px]"
            placeholder={t('Start date')!}
            onSelect={(date: Date) =>
              updateImmediateFilter({ start: formatDateParam(date) })
            }
            onReset={
              filters.start
                ? () => updateImmediateFilter({ start: '' })
                : undefined
            }
          />

          <DateTimePopover
            value={filters.end}
            className="w-[180px]"
            placeholder={t('End date')!}
            onSelect={(date: Date) =>
              updateImmediateFilter({ end: formatDateParam(date) })
            }
            onReset={
              filters.end ? () => updateImmediateFilter({ end: '' }) : undefined
            }
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (mode === 'admin' && hasPendingDraft) {
                flushDraft();
                return;
              }

              refresh(true);
            }}
            disabled={loading}
            aria-label={t('Refresh')}
            title={t('Refresh')}
          >
            <IconRefresh size={18} />
          </Button>
        </>
      }
      actions={[
        {
          key: 'export',
          element: (
            <Tips
              trigger={
                <div>
                  <ExportButton
                    exportUrl="/api/recharge/excel"
                    params={exportParams}
                    className="h-9 w-9"
                    disabled={loading}
                  />
                </div>
              }
              side="bottom"
              content={t('Export to Excel')}
            />
          ),
        },
        {
          key: 'columns',
          element: (
            <UnifiedColumnSelector
              allColumns={allColumns.map((column) => ({
                key: column.key,
                title: column.title,
              }))}
              selectedColumns={selectedColumns}
              onToggleColumn={toggleColumn}
            />
          ),
        },
      ]}
      columns={visibleColumns}
      rows={rows}
      loading={loading}
      page={page}
      totalCount={totalCount}
      rowKey={(row) => row.id}
      onPageChange={(nextPage) => {
        pushQuery(
          nextPage,
          {
            ...filters,
            ...draft,
          },
          selectedColumns,
        );
      }}
      footer={
        totalCount > 0 ? (
          <TableFooter className="bg-card">
            <TableRow>
              {visibleColumns.map((column, index) => (
                <TableCell key={column.key}>
                  {column.key === 'amount' ? (
                    <span
                      className={cn(
                        'tabular-nums',
                        stats.sumAmount < 0 ? 'text-red-500' : 'text-emerald-600',
                      )}
                    >
                      {formatAmount(stats.sumAmount)}
                    </span>
                  ) : index === 0 ? (
                    t('Total')
                  ) : (
                    ''
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        ) : undefined
      }
      mobileContent={
        loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t('No data')}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-md border-none bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <div className="font-medium">{t('Credit Amount')}</div>
                <div
                  className={cn(
                    'tabular-nums',
                    stats.sumAmount < 0 ? 'text-red-500' : 'text-emerald-600',
                  )}
                >
                  {formatAmount(stats.sumAmount)}
                </div>
              </div>
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className="space-y-1 rounded-md border-none bg-card p-3 shadow-sm"
              >
                {visibleColumns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="shrink-0 font-medium text-muted-foreground">
                      {column.title}
                    </div>
                    <div className="text-right text-foreground">
                      {column.cell(row)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      }
    />
  );
};

export default RechargeTable;

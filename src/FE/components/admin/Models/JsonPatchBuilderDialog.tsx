import React, { useEffect, useMemo, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'json';

interface TopLevelField {
  id: number;
  key: string;
  valueType: ValueType;
  value: string;
}

interface Props {
  open: boolean;
  customBody: string;
  onClose: () => void;
  onApply: (patch: string) => void;
}

let nextFieldId = 0;

const createField = (): TopLevelField => ({
  id: nextFieldId++,
  key: '',
  valueType: 'string',
  value: '',
});

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const unescapeJsonPointerSegment = (value: string) =>
  value.replaceAll('~1', '/').replaceAll('~0', '~');

const getValueType = (value: unknown): ValueType => {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'json';
};

const getFieldValue = (field: TopLevelField): unknown => {
  switch (field.valueType) {
    case 'string':
      return field.value;
    case 'number': {
      if (field.value.trim() === '') return undefined;
      const value = Number(field.value);
      return Number.isFinite(value) ? value : undefined;
    }
    case 'boolean':
      return field.value === 'true'
        ? true
        : field.value === 'false'
        ? false
        : undefined;
    case 'null':
      return null;
    case 'json':
      try {
        return JSON.parse(field.value);
      } catch {
        return undefined;
      }
  }
};

const parseTopLevelFields = (customBody: string) => {
  if (customBody.trim() === '') {
    return { fields: [createField()], containsAdvancedOperations: false };
  }

  try {
    const patch: unknown = JSON.parse(customBody);
    if (!Array.isArray(patch)) {
      throw new Error('Not an array');
    }

    const fields = patch.map((operation): TopLevelField | null => {
      if (
        typeof operation !== 'object' ||
        operation === null ||
        Array.isArray(operation)
      ) {
        return null;
      }

      const { op, path, value } = operation;
      const segment = typeof path === 'string' ? path.slice(1) : '';
      if (
        (op !== 'add' && op !== 'replace') ||
        !path?.startsWith('/') ||
        segment.length === 0 ||
        segment.includes('/') ||
        !hasOwn(operation, 'value')
      ) {
        return null;
      }

      const valueType = getValueType(value);
      return {
        id: nextFieldId++,
        key: unescapeJsonPointerSegment(segment),
        valueType,
        value:
          valueType === 'string'
            ? (value as string)
            : valueType === 'null'
            ? ''
            : JSON.stringify(value),
      };
    });

    if (fields.some((field) => field === null)) {
      throw new Error('Contains advanced operation');
    }

    return {
      fields: fields.length > 0 ? (fields as TopLevelField[]) : [createField()],
      containsAdvancedOperations: false,
    };
  } catch {
    return { fields: [createField()], containsAdvancedOperations: true };
  }
};

const JsonPatchBuilderDialog = ({
  open,
  customBody,
  onClose,
  onApply,
}: Props) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState<TopLevelField[]>([]);
  const [containsAdvancedOperations, setContainsAdvancedOperations] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    const parsed = parseTopLevelFields(customBody);
    setFields(parsed.fields);
    setContainsAdvancedOperations(parsed.containsAdvancedOperations);
  }, [customBody, open]);

  const { patch, errors } = useMemo(() => {
    const nextErrors: Record<number, string> = {};
    const keys = new Set<string>();
    const operations: object[] = [];

    fields.forEach((field) => {
      const key = field.key.trim();
      if (key === '') {
        nextErrors[field.id] = t('A field name is required.');
        return;
      }
      if (keys.has(key)) {
        nextErrors[field.id] = t('Field names must be unique.');
        return;
      }
      keys.add(key);

      const value = getFieldValue(field);
      if (value === undefined) {
        nextErrors[field.id] =
          field.valueType === 'number'
            ? t('Enter a valid number.')
            : field.valueType === 'boolean'
            ? t('Enter true or false.')
            : t('Enter valid JSON.');
        return;
      }

      operations.push({
        op: 'add',
        path: `/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        value,
      });
    });

    return {
      patch:
        fields.length > 0 && Object.keys(nextErrors).length === 0
          ? JSON.stringify(operations, null, 2)
          : '',
      errors: nextErrors,
    };
  }, [fields, t]);

  const updateField = (id: number, changes: Partial<TopLevelField>) => {
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...changes } : field,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Visual JSON Patch Generator')}</DialogTitle>
          <DialogDescription>
            {t(
              'Top-level fields only. For nested paths or advanced operations, use the JSON Patch text editor.',
            )}
          </DialogDescription>
        </DialogHeader>

        {containsAdvancedOperations && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            {t(
              'Current Patch contains nested or advanced operations. Applying this generator replaces it with top-level add operations.',
            )}
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.id} className="rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto] sm:items-end">
                <label className="space-y-1 text-sm font-medium">
                  <span>{t('Field name')}</span>
                  <Input
                    value={field.key}
                    placeholder="service_tier"
                    onChange={(event) =>
                      updateField(field.id, { key: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>{t('Value type')}</span>
                  <select
                    value={field.valueType}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onChange={(event) =>
                      updateField(field.id, {
                        valueType: event.target.value as ValueType,
                        value: event.target.value === 'boolean' ? 'true' : '',
                      })
                    }
                  >
                    <option value="string">{t('String')}</option>
                    <option value="number">{t('Number')}</option>
                    <option value="boolean">{t('Boolean')}</option>
                    <option value="null">{t('Null')}</option>
                    <option value="json">{t('JSON')}</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>{t('Value')}</span>
                  <Input
                    value={field.value}
                    disabled={field.valueType === 'null'}
                    placeholder={
                      field.valueType === 'json'
                        ? '{ "key": "value" }'
                        : undefined
                    }
                    onChange={(event) =>
                      updateField(field.id, { value: event.target.value })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFields((current) =>
                      current.filter(({ id }) => id !== field.id),
                    )
                  }
                >
                  {t('Remove')}
                </Button>
              </div>
              {errors[field.id] && (
                <p className="mt-2 text-sm text-destructive">
                  {errors[field.id]}
                </p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setFields((current) => [...current, createField()])}
          >
            {t('Add top-level field')}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('Generated JSON Patch')}</p>
          <Textarea
            value={patch}
            readOnly
            rows={8}
            placeholder={t('Add a top-level field to generate a Patch.')}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => onApply(patch)}
            disabled={patch === ''}
          >
            {t('Use generated Patch')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JsonPatchBuilderDialog;

import { FC } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { IconReasoning } from '../Icons';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface Props {
  value?: string | null;
  onValueChange: (value: string) => void;
  availableOptions: string[];
}

const ReasoningEffortRadio: FC<Props> = ({
  value = null,
  onValueChange,
  availableOptions,
}) => {
  const { t } = useTranslation();
  const defaultValue = '__default__';

  const optionValues = [
    defaultValue,
    ...availableOptions,
    ...(value && value.trim() !== '' ? [value] : []),
  ].filter((optionValue, index, items) => items.indexOf(optionValue) === index);

  const renderedOptions = optionValues.map(optionValue => ({
    value: optionValue,
    id: optionValue === defaultValue ? 'default' : `reasoning-effort-${optionValue}`,
    label: optionValue === defaultValue ? t('Default') : t(optionValue),
  }));

  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
      <label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <IconReasoning size={18} className="text-muted-foreground" />
        {t('Reasoning Effort')}
      </label>

      <RadioGroup
        className="flex flex-wrap gap-2"
        value={value ?? defaultValue}
        onValueChange={(nextValue) => {
          onValueChange(nextValue === defaultValue ? '' : nextValue);
        }}
      >
        {renderedOptions.map((option) => (
          <div key={option.value} className="relative">
            <RadioGroupItem className="peer sr-only" value={option.value} id={option.id} />
            <Label
              className="block cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
              htmlFor={option.id}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ReasoningEffortRadio;

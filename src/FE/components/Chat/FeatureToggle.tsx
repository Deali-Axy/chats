import { useEffect, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { Switch } from '@/components/ui/switch';

const FeatureToggle = (props: {
  label: string;
  enable: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const { label, enable, onChange, icon } = props;
  const [check, setCheck] = useState(enable);

  useEffect(() => {
    setCheck(enable);
  }, [enable]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/25 px-4 py-3 transition-colors hover:bg-muted/45">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Switch
            checked={check}
            onCheckedChange={(state: boolean) => {
              onChange(state);
              setCheck(state);
            }}
            id={`feature-${label}`}
          />
          <label
            htmlFor={`feature-${label}`}
            className="min-w-8 text-right text-xs font-medium text-muted-foreground"
          >
            {check ? t('Enable') : t('Close')}
          </label>
      </div>
    </div>
  );
};

export default FeatureToggle;

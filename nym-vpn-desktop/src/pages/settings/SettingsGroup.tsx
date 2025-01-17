import clsx from 'clsx';
import { ReactNode } from 'react';
import { RadioGroup } from '@headlessui/react';

type Setting = {
  title: string;
  leadingIcon?: string;
  desc?: string;
  onClick?: () => Promise<void>;
  trailing?: ReactNode;
  disabled?: boolean;
};

interface Props {
  settings: Setting[];
}

function SettingsGroup({ settings }: Props) {
  return (
    <RadioGroup>
      {settings.map((setting, index) => (
        <RadioGroup.Option
          key={setting.title}
          value={setting.title}
          onClick={setting.onClick}
          className={clsx([
            'bg-white dark:bg-baltic-sea-jaguar relative flex px-5 py-2 focus:outline-none min-h-16',
            'hover:bg-platinum dark:hover:bg-onyx',
            'transition duration-75',
            index === 0 && 'rounded-t-lg',
            index === settings.length - 1 &&
              settings.length === 2 &&
              'border-t border-mercury-pinkish dark:border-gun-powder',
            index !== 0 &&
              index !== settings.length - 1 &&
              'border-y border-mercury-pinkish dark:border-gun-powder',
            index === settings.length - 1 && 'rounded-b-lg',
            setting.desc ? 'py-2' : 'py-4',
            setting.disabled && 'opacity-50 pointer-events-none',
          ])}
        >
          <div
            role={setting.disabled ? 'none' : 'button'}
            className="flex flex-1 items-center justify-between gap-4"
          >
            {setting.leadingIcon && (
              <span className="font-icon text-2xl select-none dark:text-mercury-pinkish">
                {setting.leadingIcon}
              </span>
            )}
            <div className="flex flex-1 items-center">
              <div className="text-sm">
                <RadioGroup.Label
                  as="p"
                  className="text-base text-baltic-sea dark:text-mercury-pinkish select-none"
                >
                  {setting.title}
                </RadioGroup.Label>
                <RadioGroup.Description
                  as="span"
                  className="text-sm text-cement-feet dark:text-mercury-mist select-none"
                >
                  <span>{setting.desc}</span>
                </RadioGroup.Description>
              </div>
            </div>
            {setting.trailing}
          </div>
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}

export default SettingsGroup;

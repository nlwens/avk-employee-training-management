import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import type { Control, FieldValues, Path } from "react-hook-form";

import { TranslatedError } from "@ui/components/TranslatedError";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@ui/components/ui/combobox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@ui/components/ui/form";
import type { Group } from "@api/src";

interface GroupsComboboxControlProps {
  groups: Group[];
  selectedGroupIds: string[];
  onChange: (groupIds: string[]) => void;
  onBlur: () => void;
  fieldRef: Ref<HTMLDivElement>;
  hasError: boolean;
}

const GroupsComboboxControl = ({
  groups,
  selectedGroupIds,
  onChange,
  onBlur,
  fieldRef,
  hasError,
}: GroupsComboboxControlProps) => {
  const { t } = useTranslation(["employees"]);
  const anchorRef = useComboboxAnchor();

  const selectedGroups = groups.filter((group) =>
    selectedGroupIds.includes(group.id),
  );

  return (
    <div ref={anchorRef} className="w-full min-w-0">
      <Combobox
        items={groups}
        itemToStringValue={(group) => group.name}
        multiple
        value={selectedGroups}
        onValueChange={(nextGroups) => {
          onChange(nextGroups.map((group) => group.id));
        }}
      >
        <ComboboxChips
          ref={fieldRef}
          onBlur={onBlur}
          aria-invalid={hasError}
          className="min-h-10 w-full max-w-full gap-1.5 rounded-md border border-brand-border bg-white px-2 py-1 shadow-none focus-within:border-brand-border focus-within:ring-0 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20"
        >
          <ComboboxValue>
            {selectedGroups.map((group) => (
              <ComboboxChip
                key={group.id}
                title={group.name}
                className="h-7 max-w-full rounded-md border-0 bg-avk-blue-light/70 px-2 text-xs font-normal text-black hover:bg-avk-blue-light sm:max-w-44"
              >
                <span className="truncate">{group.name}</span>
              </ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput
            placeholder={
              selectedGroups.length === 0
                ? t(($) => $.employees.form.search_groups_placeholder)
                : ""
            }
            className="h-7 min-w-16 flex-1 bg-transparent text-sm placeholder:text-muted-foreground"
          />
        </ComboboxChips>

        <ComboboxContent
          anchor={anchorRef}
          align="start"
          sideOffset={4}
          className="w-(--anchor-width) p-0"
        >
          <ComboboxEmpty className="py-3 text-sm">
            {t(($) => $.employees.form.no_groups_found)}
          </ComboboxEmpty>
          <ComboboxList className="max-h-52">
            {(group) => (
              <ComboboxItem
                key={group.id}
                value={group}
                title={group.name}
                className="py-2 pr-8"
              >
                <span className="block truncate">{group.name}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

interface GroupsCheckboxFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  groups: Group[];
}

const GroupsCheckboxField = <TFieldValues extends FieldValues>({
  control,
  name,
  groups,
}: GroupsCheckboxFieldProps<TFieldValues>) => {
  const { t } = useTranslation(["employees"]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedGroupIds = Array.isArray(field.value)
          ? (field.value as string[])
          : [];

        return (
          <FormItem className="flex min-w-0 flex-col gap-px">
            <FormLabel className="text-base font-medium">
              {t(($) => $.employees.dashboard.groups)}
            </FormLabel>

            <FormControl>
              <GroupsComboboxControl
                groups={groups}
                selectedGroupIds={selectedGroupIds}
                onChange={field.onChange}
                onBlur={field.onBlur}
                fieldRef={field.ref}
                hasError={!!fieldState.error}
              />
            </FormControl>

            {fieldState.error?.message && (
              <TranslatedError message={fieldState.error.message} />
            )}
          </FormItem>
        );
      }}
    />
  );
};

export default GroupsCheckboxField;

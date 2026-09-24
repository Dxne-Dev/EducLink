import * as React from "react"
import { Field } from "@/components/ui/c-input-group-13-utils/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/c-input-group-13-utils/input-group"
import { Kbd } from "@/components/ui/c-input-group-13-utils/kbd"
import { cn } from "@/lib/utils"

export interface InputGroup13Props extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string
  shortcutKey?: string
}

export default function Pattern({
  wrapperClassName,
  shortcutKey = "⌘K",
  className,
  placeholder = "Rechercher une ressource...",
  ...props
}: InputGroup13Props) {
  return (
    <Field className={cn("w-full max-w-xs", wrapperClassName)}>
      <InputGroup>
        <InputGroupInput placeholder={placeholder} className={className} {...props} />
        <InputGroupAddon align="inline-end">
          <Kbd>{shortcutKey}</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return true;
    const inputDate = new Date(value);
    if (isNaN(inputDate.getTime())) return true; // let @IsDateString handle invalid format
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return inputDate <= endOfToday;
  }

  defaultMessage(): string {
    return '날짜는 오늘 이전이어야 합니다.';
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}

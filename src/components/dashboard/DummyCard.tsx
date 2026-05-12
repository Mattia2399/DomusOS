import clsx from 'clsx';

type DummyCardProps = {
  title: string;
  color: string;
};

export function DummyCard({ title, color }: DummyCardProps) {
  return <div className={clsx('flex h-full w-full items-center justify-center p-4', color)}>{title}</div>;
}

export default DummyCard;

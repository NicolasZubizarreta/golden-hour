import { getWidgetCardComponent } from './widgetRegistry';

export default function WidgetCard(props) {
  const CardComponent = getWidgetCardComponent(props.widget?.type);
  return <CardComponent {...props} />;
}

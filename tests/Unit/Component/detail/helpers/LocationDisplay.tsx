import { useLocation } from 'react-router-dom'

/** Reports the router's current path so navigations can be asserted. */
export function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

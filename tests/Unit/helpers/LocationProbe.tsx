import { useLocation } from 'react-router-dom'

/** Reports the router's current path so navigations can be asserted. */
export function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

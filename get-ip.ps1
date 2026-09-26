# get-ip.ps1
# Finds the correct local network IP by locating the adapter
# that has a default gateway (0.0.0.0/0) — works on Wi-Fi, Ethernet,
# any adapter name, any machine.

try {
    # Get the interface index of the adapter with the best default route
    $bestRoute = Get-NetRoute -DestinationPrefix '0.0.0.0/0' |
                 Sort-Object RouteMetric |
                 Select-Object -First 1

    if ($bestRoute) {
        $ip = (Get-NetIPAddress -InterfaceIndex $bestRoute.InterfaceIndex `
                                -AddressFamily IPv4 `
                                -ErrorAction Stop).IPAddress
        Write-Output $ip
    }
} catch {
    # Fallback: return empty so batch falls back to localhost
    Write-Output ""
}

declare module 'swagger-ui-react' {
  import * as React from 'react'
  interface SwaggerUIProps {
    url?: string
    spec?: object
    [key: string]: any
  }
  const SwaggerUI: React.FC<SwaggerUIProps>
  export default SwaggerUI
}

declare module 'swagger-ui-react/swagger-ui.css'

import sxml from 'sxml'

export default class BriaRequest {
  public endpoint: string
  public tag?: string
  public hasBody = false
  public xml?: sxml.XML

  /**
   * instantiate a new BriaRequest
   * @param endpoint Endpoint for request
   * @param tag Root XML tag for body
   */
  public constructor(endpoint: string, tag?: string) {
    this.endpoint = endpoint
    if (tag) {
      this.tag = tag
      this.hasBody = true
      this.xml = new sxml.XML()
      //this.xml.setTag('status')
      this.xml.setTag(this.tag)
    }
  }

  public buildRequest(userAgent: string, transactionId: string): string {
    let contentLength = 0
    let bodyString = ''
    if (this.xml) {
      const xds = sxml.XML.head('utf-8')
      const str = this.toXML().toString()
      bodyString = `${xds}\r\n${str}`
      contentLength = bodyString.length
    }

    let req = `GET /${this.endpoint}\r\n`
    req += `User-Agent: ${userAgent}\r\n`
    req += `Transaction-ID: ${transactionId}\r\n`
    req += `Content-Type: application/xml\r\n`
    req += `Content-Length: ${contentLength}`
    if (bodyString !== '') {
      req += `\r\n${bodyString}`
    }
    return req
  }

  public toXML(): sxml.XML {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.xml!
  }
}

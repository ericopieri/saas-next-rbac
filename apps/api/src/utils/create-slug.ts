export function generateSlug(text: string): string {
  const from = 'ãàáäâèéëêìíïîõòóöôùúüûñçßÿý'
  const to = 'aaaaaeeeeiiiiooooouuuuncsyy'
  const regex = new RegExp(from.split('').join('|'), 'g')

  return (
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(regex, (character) => to.charAt(from.indexOf(character))) // Replace special characters
      .replace(/&/g, '-and-')
      // eslint-disable-next-line no-useless-escape
      .replace(/[^\w\-]+/g, '')
      // eslint-disable-next-line no-useless-escape
      .replace(/\-\-+/g, '-')
      // eslint-disable-next-line no-useless-escape
      .replace(/^-+/, '')
      // eslint-disable-next-line no-useless-escape
      .replace(/-+$/, '')
  )
}
